import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalBooks,
      totalLessons,
      totalQuestions,
      userStates,
      difficultItems,
      wrongItems,
      savedVocabCount,
      learnedVocabCount,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.lesson.count({ where: { sequenceOrder: { lte: 5 } } }), // Core 5 curriculum lessons
      prisma.question.count(),
      prisma.userQuestionState.findMany({ where: { userId: user.id } }),
      prisma.reviewItem.count({ where: { userId: user.id, listType: "DIFFICULT", isManuallyRemoved: false } }),
      prisma.reviewItem.count({ where: { userId: user.id, listType: "WRONG", isManuallyRemoved: false } }),
      prisma.userVocabulary.count({ where: { userId: user.id } }),
      prisma.userVocabulary.count({ where: { userId: user.id, status: "learned" } }),
    ]);

    let solvedIndependently = 0;
    let difficultCount = 0;
    let wrongCount = 0;
    let completedCount = 0;

    for (const state of userStates) {
      if (state.isCompletedSuccessfully) completedCount++;
      if (state.classification === "SOLVED_INDEPENDENTLY") solvedIndependently++;
      if (state.classification === "DIFFICULT") difficultCount++;
      if (state.classification === "WRONG") wrongCount++;
    }

    const overallProgressPercent =
      totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalBooks,
        totalLessons,
        totalQuestions,
        completedQuestions: completedCount,
        solvedIndependently,
        difficultCount,
        wrongCount,
        activeDifficultReviews: difficultItems,
        activeWrongReviews: wrongItems,
        savedVocabCount,
        learnedVocabCount,
        overallProgressPercent,
      },
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
