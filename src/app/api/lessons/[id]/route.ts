import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const lessonId = params.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        exercises: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            questions: {
              orderBy: { sequenceOrder: "asc" },
              include: {
                choices: {
                  orderBy: { choiceLabel: "asc" },
                },
                aiHints: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const userStates = user
      ? await prisma.userQuestionState.findMany({
          where: {
            userId: user.id,
            question: { exercise: { lessonId } },
          },
        })
      : [];

    const stateMap = new Map(userStates.map((s) => [s.questionId, s]));

    // Format lesson with questions, user states, and attempts
    const exercises = lesson.exercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      instructions: ex.instructions,
      exerciseType: ex.exerciseType,
      pdfPageRef: ex.pdfPageRef,
      passageText: ex.passageText,
      questions: ex.questions.map((q) => {
        const state = stateMap.get(q.id);
        return {
          id: q.id,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          originalHint: q.originalHint,
          correctChoiceLabel: q.correctChoiceLabel,
          answerStatus: q.answerStatus,
          isFlaggedForReview: q.isFlaggedForReview,
          reviewReason: q.reviewReason,
          pdfPageRef: q.pdfPageRef,
          choices: q.choices.map((c) => ({
            id: c.id,
            choiceLabel: c.choiceLabel,
            choiceText: c.choiceText,
          })),
          userState: {
            classification: state?.classification || "PENDING",
            isCompleted: state?.isCompletedSuccessfully || false,
            attemptsCount: state?.attemptsCount || 0,
          },
          savedAiHint: q.aiHints[0]?.hintText || null,
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        pdfStartPage: lesson.pdfStartPage,
        pdfEndPage: lesson.pdfEndPage,
        exercises,
      },
    });
  } catch (error: any) {
    console.error("Lesson detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson details" },
      { status: 500 }
    );
  }
}
