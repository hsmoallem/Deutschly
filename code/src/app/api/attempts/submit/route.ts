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

    // Exclude questions that are flagged for review from student learning submission
    if (question.isFlaggedForReview || question.answerStatus === "REQUIRES_REVIEW") {
      return NextResponse.json(
        {
          requiresReview: true,
          error: "This question requires instructor review and is currently excluded from student grading.",
          pdfPageRef: question.pdfPageRef,
        },
        { status: 400 }
      );
    }

    const isCorrect =
      submittedChoice.trim().toLowerCase() ===
      question.correctChoiceLabel.trim().toLowerCase();

    // 1. Fetch prior existing state
    const existingState = await prisma.userQuestionState.findUnique({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId,
        },
      },
    });

    // 2. Record Attempt History (usedHint recorded for statistics only)
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

    // 3. Learning Rules (Final Section 6):
    // - Revealing choices alone is a normal step, NOT assistance, does not change status.
    // - Hint is optional, on request only, recorded in attempt history for statistics only. Does not change status by itself.
    // - Difficult is MANUAL ONLY. The app NEVER marks a question Difficult by itself.
    // - Right: marked correct (SOLVED_INDEPENDENTLY).
    // - Wrong: marked WRONG, and the question goes to the Wrong Answers list.
    const newClassification = isCorrect ? "SOLVED_INDEPENDENTLY" : "WRONG";

    // 4. Update UserQuestionState
    // If the student solved a question before and retries wrong, status becomes WRONG,
    // but isCompletedSuccessfully stays TRUE (lesson stays completed).
    const updatedState = await prisma.userQuestionState.upsert({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId,
        },
      },
      update: {
        classification: newClassification,
        isCompletedSuccessfully: existingState?.isCompletedSuccessfully || isCorrect,
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

    // 5. Update Review Lists (Wrong Answers)
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
          removedAt: null,
        },
        create: {
          userId: user.id,
          questionId,
          listType: "WRONG",
          isManuallyRemoved: false,
        },
      });
    } else if (newClassification === "SOLVED_INDEPENDENTLY") {
      // Solved correctly: remove from WRONG review list
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

    // 6. Check Lesson Completion
    // A lesson is completed once all questions have been answered correctly at least once
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
