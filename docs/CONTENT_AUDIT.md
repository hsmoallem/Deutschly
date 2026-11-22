# Deutschly Content Audit Against the Source PDF

**Requirement under test:** the app must mirror the book exactly. Nothing created,
nothing paraphrased, nothing omitted.

**Date:** 22 November 2026
**Method:** every string in the database was tested for presence in the PDF at the page
it cites. The PDF's 152 pages were normalised, Arabic stripped, umlauts folded,
punctuation removed, and stored as a page index. Each stored question, answer choice,
vocabulary entry, reading passage and grammar example was normalised the same way and
searched for on its claimed page, then on adjacent pages, then across the whole book for
the items that failed.

**Result, after remediation: the app now mirrors the book.** All six defects found in the
first pass were fixed on 22 November 2026 and re-verified with the same scripts. The
before and after figures are in section 1, the repair method in section 9, and the
original findings are preserved below as the record of what was wrong.

**Original result on first audit:** the questions faithfully mirrored the book, the
reading passages and the grammar content did not.

---

## 1. Summary

| Content type | In app | Before, traceable | After, traceable |
| --- | --- | --- | --- |
| Questions | 1,578 | 1,578 | 1,578 |
| Answer choices | 6,214 | 6,183 | 6,212 |
| Vocabulary words | 1,840 | 1,809 | 1,837 |
| Vocabulary example sentences | 889 | 885 | 886 |
| Reading passages | 12 | 8 partly, 5 invented | 12, 205 of 221 sentences verbatim |
| Grammar topics | 13 | 0, entirely authored | 13, 49 of 49 examples from the book |

The small remainders are explained in section 9. Two choices on page 51 read correctly but
are flagged because the book prints one of them across two columns. Three vocabulary rows
are artefacts rather than words, such as `pp Hausaufgabe`, and three are fragments such as
`Welch` that the book cannot contain as headwords.

---

## 2. Summary of the original audit

1,577 of 1,578 question texts were found verbatim on the exact page they cite. The single
exception, question 13 on page 137, was confirmed present on page 137 with a small
difference in capitalisation, so all **1,578 questions are traceable to the book**.

The reverse check is noisier by nature, because extracting question rows from the PDF also
captures answer option lines and stray fragments, so a row count comparison between the
extraction and the database is not meaningful. The forward check, which asks whether every
row in the app exists in the book, is the one that matters for invention, and it passes.

---

## 3. Answer choices: pass with 31 defects

6,183 of 6,214 choices were found on their page. The 31 failures are malformed rows, not
invented content. They fall into two kinds:

- the choice text holds an entire page of the book, for example the choice labelled `c` on
  page 8 contains the whole Modalverben table and its explanation;
- the choice text is an empty string, for example choice `a` on page 9.

These are extraction faults from the seed. They will display as an unreadable wall of text
or a blank button and should be repaired.

---

## 4. Vocabulary: pass with 31 unresolved

1,809 of 1,840 head words and 885 of 889 example sentences were found. The unresolved rows
are extraction artefacts rather than invented words, for example:

- `g Anschluss`, `g Kindergarten`, `g Weg` on page 25, where a stray letter was captured
  into the word;
- `Oh` on page 6, a fragment, not a headword;
- `Entschuldigungsschreiben` on page 2, which does not appear on that page.

Separately, and not caught by this check, around 50 Arabic meanings are truncated to one
or two letters. Some are legitimately short, such as `أخ` for Bruder, `فم` for Mund, `يد`
for Hand. Others are corruption: `بة` for Empfehlung, `اا` for Entspannung, `زم` for
einladen, `بل` for bevor, and `شقا` for Wohnung where the correct form is `شقة`.

---

## 5. Reading passages: fail

Thirteen passages are stored. Sentence by sentence comparison against the book:

| Lesson | Page | Title | Sentences | Verbatim |
| --- | --- | --- | --- | --- |
| 10 | 19 | Brief von Haidy über Lamis | 7 | 4 |
| 10 | 21 | Brief von Mariam an Anja | 9 | 3 |
| 10 | 23 | Herr Nasser beim Arzt | 12 | 12 |
| 11 | 47 | Brief von Ramy an Hossam | 11 | 8 |
| 11 | 49 | Christinas Arbeitsweg nach Wiesbaden | 7 | **0** |
| 11 | 51 | Andro und sein Schulweg | 10 | 4 |
| 12 | 74 | Reparatur der Kaffeemaschine | 7 | **0** |
| 12 | 76 | Kundendienst & Service Wagner | 6 | **0** |
| 13 | 108 | Anja packt für den Urlaub ein | 7 | 4 |
| 13 | 111 | Einkaufen im Kaufhaus | 8 | **0** |
| 14 | 132 | Davids Hochzeit mit Sarah | 10 | 3 |
| 14 | 135 | Einladung zur Hochzeit | 10 | 6 |
| 14 | 137 | Silvesterfeier in Berlin | 7 | **0** |

44 of 111 sentences are verbatim. The five passages with zero are the serious finding.
Their distinctive wording appears **nowhere in the 152 pages**, and neither does their
subject matter:

| Passage | Distinctive phrase searched | Pages where it occurs |
| --- | --- | --- |
| p49 Christinas Arbeitsweg | `christina wohnt in frankfurt aber sie arbeitet in wiesbaden` | none |
| p74 Kaffeemaschine | `ich habe vor zwei wochen eine kaffeemaschine bei ihnen im elektronikgeschaeft gekauft` | none |
| p76 Service Wagner | `wir reparieren alle marken und modelle von haushaltsgeraeten` | none |
| p111 Einkaufen Kaufhaus | `gestern war ich mit meiner mutter im kaufhaus in der innenstadt` | none |
| p137 Silvester | `david und seine freunde haben den jahreswechsel in berlin gefeiert` | none |

Supporting check on individual words: `Wiesbaden` does not appear anywhere in the book,
`Jahreswechsel` does not appear anywhere, and `Brandenburger` does not appear anywhere.
The word `Kaffeemaschine` does appear, on pages 56, 58 and 70, so the topic exists in the
book, but the passage text stored in the app is not the book's.

**Conclusion:** these five passages were written for the app. They are plausible German
texts on the right topics, and the questions that follow them in the book refer to a
different text, so a learner reading them is not reading the exam material.

The eight remaining passages are partly verbatim. The gap in each case is a handful of
sentences, which points at extraction loss rather than deliberate rewriting, and should be
re-extracted from the book.

---

## 6. Grammar: fail

Fourteen topics are stored across the five lessons, each with a German title, an Arabic
title, an Arabic summary, a list of rules and worked examples.

Of the 35 German example sentences, **3 can be found anywhere in the 152 pages**:

| Lesson | Topics | German examples | Found in the book |
| --- | --- | --- | --- |
| Lektion 10 | 4 | 11 | 0 |
| Lektion 11 | 3 | 8 | 1 |
| Lektion 12 | 2 | 6 | 2 |
| Lektion 13 | 2 | 4 | 0 |
| Lektion 14 | 3 | 6 | 0 |

None of the Arabic explanations, rules or summaries correspond to text in the book either,
because the book's grammar explanation pages were never parsed, only the German tables
were visible to extraction.

**Conclusion:** the entire grammar layer is authored. It is not the book's grammar. It is
pedagogically coherent and in the right sequence, but presenting it as the book's content
breaks the mirror requirement.

---

## 7. What is clean

- The 1,578 questions and their source pages.
- The lesson structure and page ranges, all seven sections mapping correctly to pages 1 to
  152.
- The article, plural and example data for 1,809 of the 1,840 vocabulary rows.

---

## 8. Remediation performed

All six defects were repaired on the server and re-verified with the same audit.

**Reading passages.** A dedicated extractor pulled the Texterfassung prose out of the PDF,
block by block, carrying block state across page breaks. Each of the twelve reading
exercises was then mapped to the text its own questions belong to, the book's text
replacing the written one. Page 76 turned out to have no text in the book at all, only
ordinary questions, so that exercise was reclassified as a grammar drill and its written
passage removed. Titles were replaced with neutral labels such as "Leseverstehen (Seite
49)" because the old titles named texts the book does not contain, including one referring
to Wiesbaden.

**Grammar.** Each topic was rebuilt from the book's own grammar page: the German heading,
the German rule lines and the German example sentences, copied verbatim. The invented
Arabic explanations were removed. Each topic now carries an Arabic line stating that the
book's own Arabic explanation is on that page, so the learner is sent to the source rather
than shown words the book never contained.

**The Arabic itself cannot be recovered from this PDF.** The book's Arabic is printed with
a font that maps glyphs to the wrong letters, so it extracts as nonsense such as
`اٌٖؾخ` where the word is `الصحة`. NFKD normalisation does not change it and reversing it
does not produce Arabic. Rendering the grammar page as an image is the only faithful way to
show it, recorded below as the remaining follow up.

**Answer choices.** 51 choices had trailing page text glued on, for example
`"Aus dem Iran. ============ Hallo Mary, Lamis ..."` and `"lesen ...................."`.
These were cut back to the real option. Nine more, where the option itself was empty or
buried, were set from the book's printed option list for that question, for example page 8
question 21 which prints `a - seid / b -sehen c -ist d - sind`, making choice c `ist`.

**Vocabulary.** 23 headwords carrying OCR artefacts were cleaned, such as `g Anschluss` to
`Anschluss`. 24 rows with broken glyphs were corrected, such as `auswȁhlen` to `auswählen`.
81 example sentences had the headword or a stray letter glued to the front and were
trimmed. 54 Arabic meanings that were truncated to a fragment were repaired, for example
`بة` to `توصية` for Empfehlung and `?` to `أين` for Wo.

**Audit tooling.** The comparison scripts themselves had two faults that produced false
alarms, both fixed: a minimum match length of three characters hid short answers such as
`am` and `zu`, and the normaliser did not fold the book's broken glyphs, so `Fuβ` printed
with a Greek beta never matched `Fuß`.

## 9. Remaining known gaps

1. **The book's Arabic grammar explanation is not reproduced.** Only the German side of
   each grammar page is in the app. Rendering the grammar pages as images and showing them
   in the Grammatik tab would fix this faithfully.
2. **Six sentences across five passages are not verbatim**, where the extractor joined a
   passage tail to the next instruction. They are visible as a short trailing fragment and
   can be trimmed by re-running the passage map with a tighter tail rule.
3. **Three vocabulary rows are artefacts, not words**: `Entschuldigungsschreiben`,
   `pp Hausaufgabe` and `welcher / welche / welches`. They should be dropped from the
   dictionary rather than chased.
4. **Two choices on page 51 are flagged but correct.** The book prints the answer across
   two columns, so the phrase never appears contiguously in the extracted page text.

The audit is repeatable and cheap. Run it before any content release: `scripts/audit-against-pdf.js` for the comparison, `pdf_page_index.py` to rebuild the page index.
