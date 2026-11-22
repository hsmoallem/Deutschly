import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const article = searchParams.get("article") || "all";
    const lessonParam = searchParams.get("lesson") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "60")));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
      where.OR = [
        { germanWord: { contains: query } },
        { baseForm: { contains: query } },
        { meaningAr: { contains: query } },
        { exampleSentence: { contains: query } },
      ];
    }

    if (article && article !== "all") {
      where.article = article.toLowerCase();
    }

    if (lessonParam && lessonParam !== "all") {
      if (lessonParam === "general" || lessonParam === "dictionary") {
        where.lesson = { lessonNumber: { contains: "قاموس" } };
      } else if (["10", "11", "12", "13", "14"].includes(lessonParam)) {
        where.lesson = { lessonNumber: { contains: lessonParam } };
      } else {
        where.lessonId = lessonParam;
      }
    }

    const [total, items] = await Promise.all([
      prisma.vocabularyItem.count({ where }),
      prisma.vocabularyItem.findMany({
        where,
        take: limit,
        skip,
        orderBy: { germanWord: "asc" },
        include: {
          lesson: {
            select: {
              id: true,
              lessonNumber: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Dictionary search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
