import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const listType = searchParams.get("type"); // "DIFFICULT" or "WRONG"

    if (!listType || !["DIFFICULT", "WRONG"].includes(listType)) {
      return NextResponse.json({ error: "Invalid list type" }, { status: 400 });
    }

    const items = await prisma.reviewItem.findMany({
      where: {
        userId: user.id,
        listType,
        isManuallyRemoved: false,
      },
      include: {
        question: {
          include: {
            choices: true,
            exercise: {
              include: { lesson: true },
            },
            attempts: {
              where: { userId: user.id },
              orderBy: { attemptTimestamp: "desc" },
            },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    const formatted = items.map((item) => ({
      reviewId: item.id,
      listType: item.listType,
      addedAt: item.addedAt,
      question: {
        id: item.question.id,
        num: item.question.questionNumber,
        text: item.question.questionText,
        correctChoiceLabel: item.question.correctChoiceLabel,
        answerStatus: item.question.answerStatus,
        pdfPageRef: item.question.pdfPageRef,
        lessonTitle: item.question.exercise.lesson.title,
        lessonNumber: item.question.exercise.lesson.lessonNumber,
        choices: item.question.choices.map((c) => ({
          choiceLabel: c.choiceLabel,
          choiceText: c.choiceText,
        })),
        attempts: item.question.attempts.map((a) => ({
          submittedChoice: a.submittedChoice,
          isCorrect: a.isCorrect,
          usedHint: a.usedHint,
          revealedChoices: a.revealedChoices,
          timestamp: a.attemptTimestamp,
        })),
      },
    }));

    return NextResponse.json({ success: true, items: formatted });
  } catch (error: any) {
    console.error("Review list fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch review items" }, { status: 500 });
  }
}

// Manual removal endpoint
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId, listType } = await req.json();

    if (!questionId || !listType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.reviewItem.updateMany({
      where: {
        userId: user.id,
        questionId,
        listType,
      },
      data: {
        isManuallyRemoved: true,
        removedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Item removed from review list" });
  } catch (error: any) {
    console.error("Review item delete error:", error);
    return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
  }
}
