/**
 * Enrich Deutschly lessons with the content the seed never classified.
 *
 * Problem this fixes: all 112 exercises were seeded as exerciseType
 * "grammar_drill" with no passageText, so the lesson page's Leseverstehen,
 * Alltagssituationen and Grammatik tabs matched nothing and showed zero. Only
 * the Ubungen tab had content.
 *
 * Source of truth: /home/houssam/block_map.json, extracted from the textbook PDF
 * by extract_blocks.py. Nothing here is invented; every passage is copied text.
 *
 * Safety: existing exercises are REUSED, never deleted, because Question has
 * onDelete: Cascade and deleting an exercise would destroy its questions.
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BLOCK_MAP = JSON.parse(fs.readFileSync("/home/houssam/block_map.json", "utf8"));

const TYPE = { reading: "reading", situations: "situations", grammar: "grammar_drill", drill: "grammar_drill" };
const TITLE = { reading: "Leseverstehen", situations: "Alltagssituationen", grammar: "Grammatik", drill: "Übungen" };
const INSTR = {
  reading: "Lies den folgenden Text und wähle die richtige Antwort aus!",
  situations: "Alltagssituationen: Wähle die richtige Antwort aus!",
  grammar: "Grammatik: Wähle die richtige Antwort aus!",
  drill: "Wähle die richtige Antwort aus!",
};

/** reading questions belong to the passage that started on or just before their page */
function passagePageFor(page, passagePages) {
  const candidates = passagePages.filter((p) => p <= page && page - p <= 2).sort((a, b) => b - a);
  return candidates.length ? candidates[0] : null;
}

async function main() {
  const report = [];

  for (const L of BLOCK_MAP.lessons) {
    const lesson = await prisma.lesson.findFirst({
      where: { pdfStartPage: L.start, pdfEndPage: L.end },
    });
    if (!lesson) continue;

    const passagePages = Object.keys(L.passages).map(Number);
    if (L.questions.length === 0) {
      report.push({ lesson: L.lesson, note: "no questions in this section (wordlist / notes pages)" });
      continue;
    }

    // group questions into buckets: reading -> by passage start page, others -> by page
    const buckets = new Map(); // key -> { block, page, numbers: [] }
    for (const q of L.questions) {
      let key, page;
      if (q.block === "reading") {
        const pp = passagePageFor(q.page, passagePages);
        if (pp === null) continue;              // a reading question with no passage found
        key = `reading:${pp}`;
        page = pp;
      } else {
        key = `${q.block}:${q.page}`;
        page = q.page;
      }
      if (!buckets.has(key)) buckets.set(key, { block: q.block, page, numbers: [] });
      buckets.get(key).numbers.push(q.n);
    }

    const existing = await prisma.exercise.findMany({
      where: { lessonId: lesson.id },
      orderBy: [{ pdfPageRef: "asc" }, { sequenceOrder: "asc" }],
    });
    const unconsumed = [...existing];

    let seq = 0, created = 0, reused = 0, moved = 0;
    const perBlock = {};

    const ordered = [...buckets.values()].sort((a, b) => a.page - b.page || a.block.localeCompare(b.block));

    for (const b of ordered) {
      // reuse an existing exercise on that page if one is still unused, else create
      let idx = unconsumed.findIndex((e) => e.pdfPageRef === b.page);
      let ex;
      if (idx >= 0) {
        ex = unconsumed.splice(idx, 1)[0];
        reused++;
      } else {
        ex = await prisma.exercise.create({
          data: {
            lessonId: lesson.id,
            exerciseType: TYPE[b.block],
            title: `${TITLE[b.block]} (Seite ${b.page})`,
            instructions: INSTR[b.block],
            passageText: b.block === "reading" ? L.passages[String(b.page)] || null : null,
            pdfPageRef: b.page,
            sequenceOrder: seq,
          },
        });
        created++;
      }

      await prisma.exercise.update({
        where: { id: ex.id },
        data: {
          exerciseType: TYPE[b.block],
          title: `${TITLE[b.block]} (Seite ${b.page})`,
          instructions: INSTR[b.block],
          passageText: b.block === "reading" ? L.passages[String(b.page)] || null : null,
          sequenceOrder: seq,
        },
      });
      seq++;

      // questions of this bucket may currently sit in any of this lesson's exercises
      const res = await prisma.question.updateMany({
        where: {
          exerciseId: { in: existing.map((e) => e.id) },
          questionNumber: { in: b.numbers },
          pdfPageRef: { in: b.block === "reading" ? [b.page, b.page + 1, b.page + 2] : [b.page] },
        },
        data: { exerciseId: ex.id },
      });
      moved += res.count;
      perBlock[b.block] = (perBlock[b.block] || 0) + res.count;
    }

    // Surface every extracted passage even if no question was classified into it,
    // so no page of the book's reading texts is left invisible in the app.
    const attachedPassagePages = new Set(
      ordered.filter((b) => b.block === "reading").map((b) => b.page)
    );
    for (const pStr of Object.keys(L.passages)) {
      const p = Number(pStr);
      if (attachedPassagePages.has(p)) continue;
      await prisma.exercise.create({
        data: {
          lessonId: lesson.id,
          exerciseType: "reading",
          title: `${TITLE.reading} (Seite ${p})`,
          instructions: INSTR.reading,
          passageText: L.passages[pStr],
          pdfPageRef: p,
          sequenceOrder: seq++,
        },
      });
      created++;
      attachedPassagePages.add(p);
    }

    // Grammar topics: the project's own scripts/enrich_database.py holds the real,
    // hand written grammar content and is authoritative. Never overwrite it with the
    // page-label placeholders below; only fill grammarContent when it is still empty.
    const existingTopics = lesson.grammarContent ? JSON.parse(lesson.grammarContent) : [];
    const grammarPages = [...new Set(L.questions.filter((q) => q.block === "grammar").map((q) => q.page))].sort((a, b) => a - b);
    const topics = existingTopics.length > 0 ? existingTopics : grammarPages.map((p) => ({
      id: `pdf-${lesson.sequenceOrder}-${p}`,
      titleDe: `Grammatik, Seite ${p}`,
      titleAr: "",
      pdfPage: p,
      summary: `Grammatikübungen aus dem Original, Seite ${p}.`,
      rules: [],
      examples: [],
    }));
    if (topics.length) {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { grammarContent: JSON.stringify(topics) } });
    }

    report.push({ lesson: L.lesson, reused, created, questionsMoved: moved, perBlock, grammarTopics: topics.length, passages: passagePages.length });
  }

  console.log(JSON.stringify(report, null, 1));

  console.log("\n=== final state per lesson ===");
  for (const L of BLOCK_MAP.lessons) {
    const lesson = await prisma.lesson.findFirst({ where: { pdfStartPage: L.start, pdfEndPage: L.end } });
    if (!lesson) continue;
    const ex = await prisma.exercise.findMany({ where: { lessonId: lesson.id }, select: { id: true, exerciseType: true, passageText: true } });
    const ids = ex.map((e) => e.id);
    const q = await prisma.question.count({ where: { exerciseId: { in: ids } } });
    const byType = {};
    ex.forEach((e) => (byType[e.exerciseType] = (byType[e.exerciseType] || 0) + 1));
    const withPassage = ex.filter((e) => e.passageText).length;
    const gc = lesson.grammarContent ? JSON.parse(lesson.grammarContent).length : 0;
    console.log(`${L.lesson.padEnd(12)} ${JSON.stringify(byType).padEnd(52)} questions ${String(q).padStart(4)} | passages ${withPassage} | grammarTopics ${gc}`);
  }
}

main()
  .catch((e) => { console.error("FAILED:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
