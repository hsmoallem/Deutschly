import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all", "flagged", "user_provided"
    const lessonNum = searchParams.get("lesson");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (filter === "flagged") {
      where.isFlaggedForReview = true;
    } else if (filter === "user_provided") {
      where.answerStatus = "USER_PROVIDED";
    }

    if (lessonNum) {
      where.exercise = {
        lesson: {
          lessonNumber: lessonNum,
        },
      };
    }

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ pdfPageRef: "asc" }, { questionNumber: "asc" }],
        include: {
          choices: true,
          exercise: { include: { lesson: true } },
          auditLogs: { orderBy: { changedAt: "desc" } },
        },
      }),
    ]);

    const formatted = questions.map((q) => ({
      id: q.id,
      number: q.questionNumber,
      text: q.questionText,
      correctChoiceLabel: q.correctChoiceLabel,
      answerStatus: q.answerStatus,
      isFlaggedForReview: q.isFlaggedForReview,
      reviewReason: q.reviewReason,
      pdfPageRef: q.pdfPageRef,
      lessonNumber: q.exercise.lesson.lessonNumber,
      lessonTitle: q.exercise.lesson.title,
      pageImageUrl: `/extracted/pages/page_${q.pdfPageRef}.png`,
      choices: q.choices.map((c) => ({
        label: c.choiceLabel,
        text: c.choiceText,
      })),
      auditLogs: q.auditLogs.map((log) => ({
        previousAnswer: log.previousAnswer,
        newAnswer: log.newAnswer,
        changedBy: log.changedBy,
        reason: log.reason,
        changedAt: log.changedAt,
      })),
    }));

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      questions: formatted,
    });
  } catch (error: any) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

// Update question correct answer (user override labeled USER_PROVIDED)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { questionId, newCorrectChoiceLabel, reason } = await req.json();

    if (!questionId || !newCorrectChoiceLabel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Record in AnswerAuditLog
    await prisma.answerAuditLog.create({
      data: {
        questionId,
        previousAnswer: existing.correctChoiceLabel,
        newAnswer: newCorrectChoiceLabel.toLowerCase(),
        changedBy: user.username,
        reason: reason || "User manual verification and correction",
      },
    });

    // Update question
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        correctChoiceLabel: newCorrectChoiceLabel.toLowerCase(),
        answerStatus: "USER_PROVIDED",
        isFlaggedForReview: false, // Flag is resolved!
      },
    });

    return NextResponse.json({
      success: true,
      question: updated,
      message: "Answer updated successfully and labeled as USER_PROVIDED",
    });
  } catch (error: any) {
    console.error("Admin update error:", error);
    return NextResponse.json({ error: "Failed to update answer" }, { status: 500 });
  }
}
