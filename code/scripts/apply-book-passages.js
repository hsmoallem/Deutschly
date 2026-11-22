/**
 * Replace the written reading passages with the book's own texts.
 *
 * Source of truth: /home/houssam/passage_map.json, built by build_passage_map.py,
 * which pulls the Texterfassung prose straight out of the PDF.
 *
 * Where the book has no text for a page (page 76), the exercise is reclassified from
 * "reading" to "grammar_drill" and its passage cleared, because presenting a written
 * passage there was the invention.
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MAP = JSON.parse(fs.readFileSync("/home/houssam/passage_map.json", "utf8"));

async function main() {
  const rows = [];
  for (const [pageStr, info] of Object.entries(MAP)) {
    const page = Number(pageStr);
    const exs = await prisma.exercise.findMany({ where: { pdfPageRef: page } });
    if (exs.length === 0) {
      rows.push({ page, action: "no exercise on this page" });
      continue;
    }
    for (const ex of exs) {
      if (info.text) {
        const before = (ex.passageText || "").length;
        await prisma.exercise.update({
          where: { id: ex.id },
          data: {
            passageText: info.text,
            exerciseType: "reading",
            title: `Leseverstehen (Seite ${page})`,
            instructions: "Lies den folgenden Text und wähle die richtige Antwort aus!",
          },
        });
        rows.push({ page, type: "reading", action: "passage replaced", before, after: info.text.length, source: info.source });
      } else {
        await prisma.exercise.update({
          where: { id: ex.id },
          data: {
            passageText: null,
            exerciseType: "grammar_drill",
            title: `Übungen (Seite ${page})`,
            instructions: "Wähle die richtige Antwort aus!",
          },
        });
        rows.push({ page, type: "grammar_drill", action: "no book text, reclassified and passage cleared", source: info.source });
      }
    }
  }

  rows.forEach((r) =>
    console.log(
      "  p" + String(r.page).padEnd(4) + (r.type || "").padEnd(15) + r.action +
      (r.after ? ` (${r.before} -> ${r.after} chars, ${r.source})` : ` (${r.source})`)
    )
  );

  const withPassage = await prisma.exercise.count({ where: { NOT: { passageText: null } } });
  const reading = await prisma.exercise.count({ where: { exerciseType: "reading" } });
  console.log("\n  exercises with a passage now:", withPassage);
  console.log("  exercises typed reading now:", reading);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
