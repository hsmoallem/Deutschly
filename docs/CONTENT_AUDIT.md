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

**Result: the questions faithfully mirror the book. The reading passages and the grammar
content do not.**

---

## 1. Summary

| Content type | In app | Traceable to the book | Verdict |
| --- | --- | --- | --- |
| Questions | 1,578 | 1,578 | pass |
| Answer choices | 6,214 | 6,183 | pass, 31 malformed |
| Vocabulary words | 1,840 | 1,809 | pass, 31 unresolved |
| Vocabulary example sentences | 889 | 885 | pass, 4 unresolved |
| Reading passages | 13 | 8 | **fail**, 5 written, not in the book |
| Grammar topics | 14 | 0 fully | **fail**, authored, not extracted |
| Grammar German examples | 35 | 3 | **fail** |

---

## 2. Questions: pass

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

## 8. Remediation plan

1. **Replace the 5 written passages** with the book's own reading texts for pages 49, 74,
   76, 111 and 137, extracted from the Texterfassung blocks. The extraction approach
   already exists and produced real texts for the other pages.
2. **Re-extract the 8 partial passages** to close the missing sentence gaps.
3. **Rebuild the grammar layer from the book.** Extract the German grammar tables and the
   Arabic explanation text from the grammar pages of each lesson. If the Arabic text cannot
   be extracted reliably, keep the authored explanations but label them clearly as
   supplementary, so nothing is presented as the book's words.
4. **Repair the 31 malformed choices** so no button contains a page of text or is empty.
5. **Fix the 31 vocabulary rows** that do not resolve, and correct the truncated Arabic
   meanings. The short but correct entries such as `أخ`, `فم` and `يد` must be left alone.
6. **Re-run this audit** after each change. The scripts are `scripts/audit-against-pdf.js`
   for the comparison and `pdf_page_index.py` for the page index.

The audit is repeatable and cheap. It should be run before any content release.
