import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const article = searchParams.get("article") || "all";
    const limit = parseInt(searchParams.get("limit") || "48");

    const where: any = {};

    if (query) {
      where.OR = [
        { germanWord: { contains: query } },
        { baseForm: { contains: query } },
        { meaningAr: { contains: query } },
      ];
    }

    if (article && article !== "all") {
      where.article = article.toLowerCase();
    }

    const items = await prisma.vocabularyItem.findMany({
      where,
      take: limit,
      orderBy: { germanWord: "asc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Dictionary search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
