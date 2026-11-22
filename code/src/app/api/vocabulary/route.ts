import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "saved" or "master"
    const lessonId = searchParams.get("lessonId");
    const article = searchParams.get("article");
    const q = searchParams.get("q");

    // 1. If requesting user saved bookmarks
    if (type === "saved") {
      const user = await getCurrentUser();
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const vocab = await prisma.userVocabulary.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, vocabulary: vocab });
    }

    // 2. Otherwise return Master Textbook Vocabulary Items
    const whereClause: any = {};
    if (lessonId && lessonId !== "all") {
      whereClause.lessonId = lessonId;
    }
    if (article && article !== "all") {
      whereClause.article = article.toLowerCase();
    }
    if (q) {
      whereClause.OR = [
        { germanWord: { contains: q } },
        { baseForm: { contains: q } },
        { meaningAr: { contains: q } },
      ];
    }

    const items = await prisma.vocabularyItem.findMany({
      where: whereClause,
      include: {
        lesson: {
          select: {
            id: true,
            lessonNumber: true,
            title: true,
          },
        },
      },
      orderBy: [
        { pdfPageRef: "asc" },
        { germanWord: "asc" },
      ],
    });

    return NextResponse.json({ success: true, vocabulary: items });
  } catch (error: any) {
    console.error("Vocabulary fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch vocabulary" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      selectedWord,
      baseWord,
      article,
      pluralForm,
      meaningEn,
      meaningAr,
      wordType,
      sentenceContext,
      pdfPageRef,
    } = await req.json();

    if (!selectedWord || !baseWord) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    // Check if already saved for this user
    const existing = await prisma.userVocabulary.findFirst({
      where: {
        userId: user.id,
        baseWord: baseWord.toLowerCase(),
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        vocabulary: existing,
        message: "Word already in your vocabulary list",
      });
    }

    const item = await prisma.userVocabulary.create({
      data: {
        userId: user.id,
        selectedWord,
        baseWord,
        article,
        pluralForm,
        meaningEn: meaningEn || selectedWord,
        meaningAr,
        wordType: wordType || "word",
        sentenceContext,
        pdfPageRef,
      },
    });

    return NextResponse.json({ success: true, vocabulary: item });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to save vocabulary" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await req.json(); // status: "learning", "difficult", "learned"
    const updated = await prisma.userVocabulary.updateMany({
      where: { id, userId: user.id },
      data: { status },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update vocabulary status" }, { status: 500 });
  }
}
