/**
 * Audit the Deutschly database against the source PDF.
 *
 * The rule being tested: the app must mirror the book, nothing invented. Every
 * question, choice and vocabulary item must be findable in the PDF text at the page
 * it claims, and every question the book contains should exist in the app.
 *
 * Inputs:  /home/houssam/pdf_pages.json  (normalised text of all 152 pages)
 *          /home/houssam/pdf_truth.json  (question rows extracted per lesson)
 * Output:  /home/houssam/pdf_audit.json plus a printed report.
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PAGES = JSON.parse(fs.readFileSync("/home/houssam/pdf_pages.json", "utf8"));
const TRUTH = JSON.parse(fs.readFileSync("/home/houssam/pdf_truth.json", "utf8"));

const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/g;

function norm(s) {
  if (!s) return "";
  let x = String(s).replace(ARABIC, " ");
  // fold the PDF's broken glyphs to real letters first, then expand umlauts, then NFKD
  x = x.replace(/[\u0171\u0215\u04f1]/g, "ü").replace(/[\u04e7]/g, "ö")
       .replace(/[\u0201\u04d3]/g, "ä").replace(/[\u03b2]/g, "ß");
  x = x.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  x = x.replace(/Ä/g, "ae").replace(/Ö/g, "oe").replace(/Ü/g, "ue");
  x = x.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  x = x.toLowerCase();
  x = x.replace(/[^a-z0-9]+/g, "");
  return x;
}

/** does this normalised needle appear on the page, or within one page either side? */
function onPage(needle, page, tolerance = 1) {
  if (!needle || needle.length < 1) return { found: false, exact: false, where: null };
  for (let d = 0; d <= tolerance; d++) {
    for (const p of d === 0 ? [page] : [page - d, page + d]) {
      const txt = PAGES[String(p)];
      if (!txt) continue;
      if (txt.includes(needle)) {
        return { found: true, exact: d === 0, where: p };
      }
    }
  }
  return { found: false, exact: false, where: null };
}

async function main() {
  const result = { questions: {}, choices: {}, vocabulary: {}, passages: {}, coverage: {}, grammar: {} };

  // ---------- 1. questions ----------
  const questions = await prisma.question.findMany({
    include: { choices: true, exercise: { include: { lesson: true } } },
  });
  let qExact = 0, qNear = 0, qMissing = 0;
  const qMissingSamples = [];
  for (const q of questions) {
    const n = norm(q.questionText);
    const r = onPage(n, q.pdfPageRef, 1);
    if (r.found && r.exact) qExact++;
    else if (r.found) qNear++;
    else {
      qMissing++;
      if (qMissingSamples.length < 15) {
        qMissingSamples.push({ page: q.pdfPageRef, n: q.questionNumber, text: (q.questionText || "").slice(0, 90) });
      }
    }
  }
  result.questions = { total: questions.length, onExactPage: qExact, onAdjacentPage: qNear, notFoundInPdf: qMissing, samples: qMissingSamples };

  // ---------- 2. choices ----------
  let cExact = 0, cNear = 0, cMissing = 0;
  const cSamples = [];
  let cTotal = 0;
  for (const q of questions) {
    for (const c of q.choices) {
      cTotal++;
      const r = onPage(norm(c.choiceText), q.pdfPageRef, 1);
      if (r.found && r.exact) cExact++;
      else if (r.found) cNear++;
      else {
        cMissing++;
        if (cSamples.length < 15) cSamples.push({ page: q.pdfPageRef, label: c.choiceLabel, text: (c.choiceText || "").slice(0, 70) });
      }
    }
  }
  result.choices = { total: cTotal, onExactPage: cExact, onAdjacentPage: cNear, notFoundInPdf: cMissing, samples: cSamples };

  // ---------- 3. vocabulary ----------
  const vocab = await prisma.vocabularyItem.findMany({ include: { lesson: true } });
  let vWord = 0, vWordMissing = 0, vExample = 0, vExampleMissing = 0;
  const vSamples = [];
  for (const v of vocab) {
    const w = norm((v.baseForm || v.germanWord || "").replace(/^\(.*?\)\s*/, ""));
    const rw = onPage(w, v.pdfPageRef, 2);
    if (rw.found) vWord++;
    else {
      vWordMissing++;
      if (vSamples.length < 15) vSamples.push({ page: v.pdfPageRef, word: v.germanWord, kind: "word" });
    }
    if (v.exampleSentence) {
      const re = onPage(norm(v.exampleSentence), v.pdfPageRef, 2);
      if (re.found) vExample++;
      else {
        vExampleMissing++;
        if (vSamples.length < 20) vSamples.push({ page: v.pdfPageRef, word: v.germanWord, kind: "example", text: v.exampleSentence.slice(0, 60) });
      }
    }
  }
  result.vocabulary = {
    total: vocab.length,
    wordFoundInPdf: vWord,
    wordNotFound: vWordMissing,
    withExample: vocab.filter((v) => v.exampleSentence).length,
    exampleFoundInPdf: vExample,
    exampleNotFound: vExampleMissing,
    samples: vSamples,
  };

  // ---------- 4. reading passages, verbatim check ----------
  const reading = await prisma.exercise.findMany({
    where: { NOT: { passageText: null } },
    include: { lesson: true },
  });
  const passageReport = [];
  for (const ex of reading) {
    const text = ex.passageText || "";
    const sentences = text.split(/(?<=[.!?])\s+/).map((s) => norm(s)).filter((s) => s.length >= 12);
    let hit = 0;
    const misses = [];
    for (const s of sentences) {
      const r = onPage(s, ex.pdfPageRef, 3);
      if (r.found) hit++;
      else misses.push(s.slice(0, 60));
    }
    passageReport.push({
      lesson: ex.lesson ? ex.lesson.lessonNumber : "?",
      page: ex.pdfPageRef,
      title: ex.title,
      chars: text.length,
      sentences: sentences.length,
      verbatim: hit,
      notVerbatim: sentences.length - hit,
      missSamples: misses.slice(0, 5),
    });
  }
  result.passages = passageReport;

  // ---------- 5. reverse coverage: what the book has that the app may not ----------
  const coverage = [];
  for (const [lessonName, t] of Object.entries(TRUTH)) {
    const lesson = await prisma.lesson.findFirst({ where: { pdfStartPage: t.start, pdfEndPage: t.end } });
    if (!lesson) continue;
    const dbQ = await prisma.question.findMany({
      where: { exercise: { lessonId: lesson.id } },
      select: { questionText: true, pdfPageRef: true, questionNumber: true },
    });
    const dbNorm = dbQ.map((q) => norm(q.questionText));
    let matched = 0;
    const unmatched = [];
    for (const row of t.questions) {
      const n = norm(row.text);
      if (n.length < 3) continue;
      const probe = n.slice(0, Math.min(45, n.length));
      const found = dbNorm.some((d) => d.includes(probe) || probe.includes(d.slice(0, 45)));
      if (found) matched++;
      else if (unmatched.length < 12) unmatched.push({ page: row.page, n: row.n, text: row.text.slice(0, 80) });
      else unmatched.push(null);
    }
    coverage.push({
      lesson: lessonName,
      pdfRows: t.questions.length,
      matchedInApp: matched,
      pdfRowsWithNoAppMatch: unmatched.filter(Boolean).length + Math.max(0, unmatched.length - 12),
      samples: unmatched.filter(Boolean),
    });
  }
  result.coverage = coverage;

  // ---------- 6. grammar topics: authored vs drawn from the book ----------
  const lessons = await prisma.lesson.findMany();
  const grammar = [];
  for (const l of lessons) {
    if (!l.grammarContent) continue;
    const topics = JSON.parse(l.grammarContent);
    let exChecked = 0, exFound = 0;
    for (const t of topics) {
      for (const e of t.examples || []) {
        exChecked++;
        if (onPage(norm(e.de), t.pdfPage, 2).found) exFound++;
      }
    }
    grammar.push({ lesson: l.lessonNumber, topics: topics.length, germanExamples: exChecked, examplesFoundInPdf: exFound });
  }
  result.grammar = grammar;

  fs.writeFileSync("/home/houssam/pdf_audit.json", JSON.stringify(result, null, 1));

  // ---------- report ----------
  console.log("QUESTIONS");
  console.log("  total in app:", result.questions.total);
  console.log("  found on claimed page:", result.questions.onExactPage);
  console.log("  found one page away:", result.questions.onAdjacentPage);
  console.log("  NOT found in PDF:", result.questions.notFoundInPdf);
  result.questions.samples.forEach((s) => console.log("     p" + s.page + " #" + s.n + "  " + s.text));
  console.log("");
  console.log("CHOICES");
  console.log("  total:", result.choices.total, "| on page:", result.choices.onExactPage,
    "| adjacent:", result.choices.onAdjacentPage, "| NOT found:", result.choices.notFoundInPdf);
  result.choices.samples.slice(0, 8).forEach((s) => console.log("     p" + s.page + " (" + s.label + ")  " + s.text));
  console.log("");
  console.log("VOCABULARY");
  console.log("  total:", result.vocabulary.total);
  console.log("  word found in PDF:", result.vocabulary.wordFoundInPdf, "| not found:", result.vocabulary.wordNotFound);
  console.log("  with example sentence:", result.vocabulary.withExample,
    "| example found in PDF:", result.vocabulary.exampleFoundInPdf,
    "| example not found:", result.vocabulary.exampleNotFound);
  result.vocabulary.samples.slice(0, 8).forEach((s) => console.log("     p" + s.page + " [" + s.kind + "] " + s.word + " " + (s.text || "")));
  console.log("");
  console.log("READING PASSAGES");
  passageReport.forEach((p) => console.log("  " + p.lesson.padEnd(11) + " p" + String(p.page).padStart(3) +
    "  sentences " + String(p.sentences).padStart(3) + "  verbatim " + String(p.verbatim).padStart(3) +
    "  not verbatim " + String(p.notVerbatim).padStart(3) + "  " + (p.title || "").slice(0, 46)));
  console.log("");
  console.log("REVERSE COVERAGE, book rows with no match in the app");
  coverage.forEach((c) => console.log("  " + c.lesson.padEnd(11) + " pdf rows " + String(c.pdfRows).padStart(4) +
    "  matched " + String(c.matchedInApp).padStart(4) + "  unmatched " + String(c.pdfRowsWithNoAppMatch).padStart(3)));
  console.log("");
  console.log("GRAMMAR");
  grammar.forEach((g) => console.log("  " + g.lesson.padEnd(11) + " topics " + g.topics +
    " | German examples " + g.germanExamples + " | found in PDF " + g.examplesFoundInPdf));
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
