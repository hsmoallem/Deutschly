/**
 * Second pass: verify the audit findings instead of trusting the first run.
 *
 * Three things need checking because they may be artefacts of my matching rather
 * than genuine defects:
 *   1. 502 choices "not found" are mostly one and two letter words, and my first
 *      pass ignored needles shorter than three characters.
 *   2. Some reading passages matched zero sentences. Either the database text was
 *      rewritten, or the PDF page did not extract properly.
 *   3. The grammar examples were checked only against their own topic page. Search
 *      the entire book before calling them invented.
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PAGES = JSON.parse(fs.readFileSync("/home/houssam/pdf_pages.json", "utf8"));
const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/g;

function norm(s) {
  if (!s) return "";
  let x = String(s).replace(ARABIC, " ");
  x = x.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  x = x.replace(/Ä/g, "ae").replace(/Ö/g, "oe").replace(/Ü/g, "ue");
  return x.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function searchBook(needle, tolerance, page) {
  if (!needle || needle.length === 0) return { found: false, where: null };
  for (let d = 0; d <= tolerance; d++) {
    for (const p of d === 0 ? [page] : [page - d, page + d]) {
      const t = PAGES[String(p)];
      if (t && t.includes(needle)) return { found: true, where: p };
    }
  }
  return { found: false, where: null };
}

async function main() {
  // ---------- 1. choices, including very short answers ----------
  const questions = await prisma.question.findMany({ include: { choices: true } });
  let total = 0, found = 0, missing = 0;
  const buckets = { len1: 0, len2: 0, len3plus: 0 };
  const samples = [];
  for (const q of questions) {
    for (const c of q.choices) {
      total++;
      const n = norm(c.choiceText);
      const r = searchBook(n, 1, q.pdfPageRef);
      if (r.found) found++;
      else {
        missing++;
        if (n.length === 1) buckets.len1++;
        else if (n.length === 2) buckets.len2++;
        else buckets.len3plus++;
        if (samples.length < 20) samples.push({ page: q.pdfPageRef, label: c.choiceLabel, text: c.choiceText, norm: n });
      }
    }
  }
  console.log("CHOICES, re-tested with no minimum length");
  console.log("  total", total, "| found", found, "| not found", missing);
  console.log("  not found by length: 1 char", buckets.len1, "| 2 chars", buckets.len2, "| 3+", buckets.len3plus);
  samples.forEach((s) => console.log("     p" + s.page + " (" + s.label + ") " + JSON.stringify(s.text) + "  norm=" + JSON.stringify(s.norm)));
  console.log("");

  // ---------- 2. passages that matched zero, compared with the actual page ----------
  const reading = await prisma.exercise.findMany({ where: { NOT: { passageText: null } }, orderBy: { pdfPageRef: "asc" } });
  console.log("PASSAGES WITH NO VERBATIM SENTENCE, shown against the real page text");
  for (const ex of reading) {
    const sentences = (ex.passageText || "").split(/(?<=[.!?])\s+/).map(norm).filter((s) => s.length >= 12);
    let hit = 0;
    for (const s of sentences) if (searchBook(s, 3, ex.pdfPageRef).found) hit++;
    if (hit > 0) continue;
    console.log("");
    console.log("  ---- page " + ex.pdfPageRef + " : " + ex.title + " ----");
    console.log("  database text: " + (ex.passageText || "").slice(0, 260));
    console.log("  pdf page text: " + (PAGES[String(ex.pdfPageRef)] || "").slice(0, 260));
    console.log("  pdf page length: " + (PAGES[String(ex.pdfPageRef)] || "").length + " normalised chars");
  }
  console.log("");

  // ---------- 3. grammar examples, searched across the whole book ----------
  const lessons = await prisma.lesson.findMany();
  console.log("GRAMMAR EXAMPLES, searched across all 152 pages");
  for (const l of lessons) {
    if (!l.grammarContent) continue;
    const topics = JSON.parse(l.grammarContent);
    const all = [];
    for (const t of topics) for (const e of t.examples || []) all.push({ topic: t.titleDe, page: t.pdfPage, de: e.de });
    let inBook = 0;
    const notInBook = [];
    for (const e of all) {
      const n = norm(e.de);
      let hit = false;
      for (let p = 1; p <= 152 && !hit; p++) if ((PAGES[String(p)] || "").includes(n)) hit = true;
      if (hit) inBook++;
      else if (notInBook.length < 6) notInBook.push({ page: e.page, de: e.de.slice(0, 80), topic: (e.topic || "").slice(0, 40) });
    }
    console.log("  " + l.lessonNumber.padEnd(11) + " examples " + String(all.length).padStart(2) +
      " | found somewhere in the book " + String(inBook).padStart(2) + " | nowhere " + (all.length - inBook));
    notInBook.forEach((x) => console.log("       p" + x.page + "  " + x.de));
  }
  console.log("");

  // ---------- 4. reverse coverage, show what did not match ----------
  const TRUTH = JSON.parse(fs.readFileSync("/home/houssam/pdf_truth.json", "utf8"));
  console.log("BOOK QUESTION ROWS WITH NO MATCH IN THE APP, samples");
  for (const [name, t] of Object.entries(TRUTH)) {
    const lesson = await prisma.lesson.findFirst({ where: { pdfStartPage: t.start, pdfEndPage: t.end } });
    if (!lesson) continue;
    const dbQ = await prisma.question.findMany({ where: { exercise: { lessonId: lesson.id } }, select: { questionText: true } });
    const dbNorm = dbQ.map((q) => norm(q.questionText));
    const unmatched = [];
    for (const row of t.questions) {
      const n = norm(row.text);
      if (n.length < 3) continue;
      const probe = n.slice(0, Math.min(45, n.length));
      if (!dbNorm.some((d) => d.includes(probe) || probe.includes(d.slice(0, 45)))) {
        if (unmatched.length < 6) unmatched.push({ page: row.page, n: row.n, text: row.text.slice(0, 95) });
      }
    }
    console.log("  ---- " + name + " ----");
    unmatched.forEach((u) => console.log("     p" + u.page + " #" + u.n + "  " + u.text));
  }
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
