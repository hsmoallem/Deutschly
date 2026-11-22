import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    const lessons = await prisma.lesson.findMany({
      orderBy: { sequenceOrder: "asc" },
      include: {
        exercises: {
          include: {
            questions: {
              select: { id: true },
            },
          },
        },
      },
    });

    const userStates = user
      ? await prisma.userQuestionState.findMany({
          where: { userId: user.id },
        })
      : [];

    const stateMap = new Map(userStates.map((s) => [s.questionId, s]));

    const formatted = lessons.map((l) => {
      const allQIds = l.exercises.flatMap((e) => e.questions.map((q) => q.id));
      const totalQuestions = allQIds.length;
      
      let completedQuestions = 0;
      let independentQuestions = 0;
      let difficultQuestions = 0;
      let wrongQuestions = 0;

      for (const qid of allQIds) {
        const state = stateMap.get(qid);
        if (state?.isCompletedSuccessfully) {
          completedQuestions++;
        }
        if (state?.classification === "SOLVED_INDEPENDENTLY") independentQuestions++;
        if (state?.classification === "DIFFICULT") difficultQuestions++;
        if (state?.classification === "WRONG") wrongQuestions++;
      }

      const isCompleted = totalQuestions > 0 && completedQuestions === totalQuestions;
      const isInProgress = completedQuestions > 0 && !isCompleted;
      const status = isCompleted ? "COMPLETED" : isInProgress ? "IN_PROGRESS" : "NOT_STARTED";

      return {
        id: l.id,
        lessonNumber: l.lessonNumber,
        title: l.title,
        pdfStartPage: l.pdfStartPage,
        pdfEndPage: l.pdfEndPage,
        totalExercises: l.exercises.length,
        totalQuestions,
        completedQuestions,
        independentQuestions,
        difficultQuestions,
        wrongQuestions,
        status,
        progressPercent: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0,
      };
    });

    return NextResponse.json({ success: true, lessons: formatted });
  } catch (error: any) {
    console.error("Lessons fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}
