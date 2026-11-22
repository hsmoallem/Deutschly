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

    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [
          { id: lessonId },
          { lessonNumber: lessonId },
          { lessonNumber: `Lektion ${lessonId}` },
          { sequenceOrder: parseInt(lessonId) || -1 },
        ],
      },
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
            question: { exercise: { lessonId: lesson.id } },
          },
        })
      : [];

    const reviewItems = user
      ? await prisma.reviewItem.findMany({
          where: {
            userId: user.id,
            isManuallyRemoved: false,
            question: { exercise: { lessonId: lesson.id } },
          },
        })
      : [];

    const stateMap = new Map(userStates.map((s) => [s.questionId, s]));
    const difficultSet = new Set(
      reviewItems.filter((r) => r.listType === "DIFFICULT").map((r) => r.questionId)
    );

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
          isDifficult: difficultSet.has(q.id),
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

    const vocabItems = await prisma.vocabularyItem.findMany({
      where: { lessonId: lesson.id },
      orderBy: { pdfPageRef: "asc" },
    });

    let parsedGrammar = null;
    if (lesson.grammarContent) {
      try {
        parsedGrammar = JSON.parse(lesson.grammarContent);
      } catch (e) {
        parsedGrammar = null;
      }
    }

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        pdfStartPage: lesson.pdfStartPage,
        pdfEndPage: lesson.pdfEndPage,
        grammarTopics: parsedGrammar || [],
        vocabulary: vocabItems,
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
