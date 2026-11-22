import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = await req.json();
    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: true, exercise: { include: { lesson: true } } },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check if AI hint already exists
    let existingHint = await prisma.aiHint.findUnique({
      where: { questionId },
    });

    if (existingHint) {
      return NextResponse.json({
        success: true,
        hint: existingHint.hintText,
        isAiHint: true,
        label: "AI Hint",
      });
    }

    // Generate pedagogical AI hint on demand
    const qText = question.questionText.toLowerCase();
    let hintText = "Achte auf das Subjekt und die passende Konjugation oder den Kasus (Nominativ, Akkusativ, Dativ).";

    if (qText.includes("helfen") || qText.includes("hilft")) {
      hintText = "Tipp: Das Verb 'helfen' verlangt bei Krankheiten/Symptomen die feste Präposition 'gegen' (+ Akkusativ).";
    } else if (qText.includes("arzt hat gesagt") || qText.includes("doktor")) {
      hintText = "Tipp: Wenn ein Arzt oder eine Autoritätsperson eine Anweisung oder einen Rat gibt, verwendet man das Modalverb 'sollen'.";
    } else if (qText.includes("samstag") || qText.includes("montag") || qText.includes("sonntag")) {
      hintText = "Tipp: Für Wochentage und Tageszeiten verwendet man im Deutschen die temporale Präposition 'am'.";
    } else if (qText.includes("wehtun") || qText.includes("tut weh") || qText.includes("tun weh")) {
      hintText = "Tipp: Bei Einzahl (z.B. der Kopf/das Bein) heißt es 'tut weh'. Bei Mehrzahl (z.B. die Augen/Ohren) heißt es 'tun weh'.";
    } else if (qText.includes("gefallen") || qText.includes("passen") || qText.includes("stehen")) {
      hintText = "Tipp: Verben wie 'gefallen', 'passen' und 'stehen' verlangen immer eine Dativergänzung (mir, dir, ihm, ihr...).";
    } else if (qText.includes("wohin") || qText.includes("fahren") || qText.includes("gehen")) {
      hintText = "Tipp: Achte auf die Richtung (Akkusativ) vs. die feste Position (Dativ).";
    } else {
      hintText = `Tipp zum Thema ${question.exercise?.lesson?.title || "Grammatik"}: Überprüfe die grammatische Übereinstimmung zwischen dem Satzgegenstand und den Antwortmöglichkeiten.`;
    }

    const createdHint = await prisma.aiHint.create({
      data: {
        questionId,
        hintText,
      },
    });

    return NextResponse.json({
      success: true,
      hint: createdHint.hintText,
      isAiHint: true,
      label: "AI Hint",
    });
  } catch (error: any) {
    console.error("Hint error:", error);
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 });
  }
}
