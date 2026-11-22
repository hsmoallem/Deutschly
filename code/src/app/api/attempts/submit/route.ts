import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      questionId,
      submittedChoice,
      usedHint = false,
      revealedChoices = false,
      listenedRevealedChoices = false,
    } = await req.json();

    if (!questionId || !submittedChoice) {
      return NextResponse.json(
        { error: "questionId and submittedChoice are required" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        exercise: {
          include: {
            lesson: true,
            questions: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect =
      submittedChoice.trim().toLowerCase() ===
      question.correctChoiceLabel.trim().toLowerCase();

    // 1. Record Attempt History
    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        questionId,
        submittedChoice: submittedChoice.trim().toLowerCase(),
        isCorrect,
        usedHint,
        revealedChoices,
        listenedRevealedChoices,
      },
    });

    // 2. Fetch existing state
    const existingState = await prisma.userQuestionState.findUnique({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId,
        },
      },
    });

    // Assistance was used on THIS attempt if user requested hint, revealed choices, or played revealed choices
    const usedAssistanceOnThisAttempt =
      usedHint || revealedChoices || listenedRevealedChoices;

    let newClassification = "PENDING";

    if (!isCorrect) {
      // Wrong answer always classifies as WRONG regardless of hint/reveal
      newClassification = "WRONG";
    } else {
      // Answer is correct!
      if (usedAssistanceOnThisAttempt) {
        newClassification = "DIFFICULT";
      } else {
        newClassification = "SOLVED_INDEPENDENTLY";
      }
    }

    // 3. Update UserQuestionState
    const updatedState = await prisma.userQuestionState.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId,
        },
      },
      update: {
        classification: newClassification,
        isCompletedSuccessfully:
          existingState?.isCompletedSuccessfully || isCorrect,
        attemptsCount: (existingState?.attemptsCount || 0) + 1,
        lastAttemptAt: new Date(),
      },
      create: {
        userId: user.id,
        questionId,
        classification: newClassification,
        isCompletedSuccessfully: isCorrect,
        attemptsCount: 1,
        lastAttemptAt: new Date(),
      },
    });

    // 4. Update Review Lists (Difficult & Wrong)
    if (newClassification === "WRONG") {
      // Add or reactivate in WRONG review list
      await prisma.reviewItem.upsert({
        where: {
          userId_questionId_listType: {
            userId: user.id,
            questionId,
            listType: "WRONG",
          },
        },
        update: {
          isManuallyRemoved: false,
          addedAt: new Date(),
        },
        create: {
          userId: user.id,
          questionId,
          listType: "WRONG",
          isManuallyRemoved: false,
        },
      });
    } else if (newClassification === "DIFFICULT") {
      // Add or reactivate in DIFFICULT review list
      await prisma.reviewItem.upsert({
        where: {
          userId_questionId_listType: {
            userId: user.id,
            questionId,
            listType: "DIFFICULT",
          },
        },
        update: {
          isManuallyRemoved: false,
          addedAt: new Date(),
        },
        create: {
          userId: user.id,
          questionId,
          listType: "DIFFICULT",
          isManuallyRemoved: false,
        },
      });
    } else if (newClassification === "SOLVED_INDEPENDENTLY") {
      // If solved independently, remove active item from WRONG review list
      await prisma.reviewItem.updateMany({
        where: {
          userId: user.id,
          questionId,
          listType: "WRONG",
        },
        data: {
          isManuallyRemoved: true,
          removedAt: new Date(),
        },
      });
    }

    // 5. Check Lesson Completion
    // A lesson is completed only when all exercises have all questions answered correctly at least once
    const lessonId = question.exercise.lessonId;
    const allLessonQuestions = await prisma.question.findMany({
      where: {
        exercise: {
          lessonId,
        },
      },
      select: { id: true },
    });

    const successfulStates = await prisma.userQuestionState.count({
      where: {
        userId: user.id,
        questionId: { in: allLessonQuestions.map((q) => q.id) },
        isCompletedSuccessfully: true,
      },
    });

    const isLessonCompleted =
      allLessonQuestions.length > 0 &&
      successfulStates === allLessonQuestions.length;

    return NextResponse.json({
      success: true,
      isCorrect,
      correctChoiceLabel: question.correctChoiceLabel,
      classification: newClassification,
      attemptsCount: updatedState.attemptsCount,
      isLessonCompleted,
      progress: {
        totalQuestionsInLesson: allLessonQuestions.length,
        completedQuestionsInLesson: successfulStates,
      },
    });
  } catch (error: any) {
    console.error("Submit attempt error:", error);
    return NextResponse.json(
      { error: "Failed to submit attempt" },
      { status: 500 }
    );
  }
}
