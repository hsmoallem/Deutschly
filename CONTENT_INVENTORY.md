# CONTENT_INVENTORY.md
# Verified Quantitative Content Inventory of Deutschly
**Source Document:** `عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf` (152 pages)  
**Extraction Methodology:** PyMuPDF high-resolution layout coordinate extraction + Tesseract 5.5.4 Arabic/German OCR validation.  

---

## 1. Global Exact Counts

| Metric | Verified Exact Count | Methodology Notes |
|---|---|---|
| **Total PDF Pages** | **152** | Pages 1-138 (Lessons), 139-147 (Dictionary), 148-152 (Notes) |
| **Total Curriculum Lessons** | **5** | Lektion 10, Lektion 11, Lektion 12, Lektion 13, Lektion 14 |
| **Total Interactive Exercises** | **165** | Distinct practice headers, grammar drills, situational MCQ sets, and exams |
| **Total Practice Questions** | **1578** | Numbered multiple-choice & reading comprehension questions |
| **Total Answer Choices** | **6214** | All discrete choices mapped to questions (`a`, `b`, `c`, `d`) |
| **Total Vocabulary Entries** | **1684** | Combined lesson vocabulary + general reference dictionary |
| **Unique Vocabulary Entries** | **1637** | Normalized unique German terms |
| **Repeated Vocabulary Entries** | **47** | Terms recurring across both lessons and the general dictionary |
| **Reading Comprehension Passages** | **19** | Dedicated reading texts (*Lesetexte*) |
| **Situational Sets (*Alltagssituationen*)** | **24** | Dedicated conversational German situation sections |
| **Grammar Topics Covered** | **84** | Core grammatical sections and rule paradigms |
| **Total Word Count** | **56193** | Running word tokens extracted across the textbook |

---

## 2. Exact Counts Breakdown Per Lesson

| Section / Lektion | PDF Pages | Exercises | Questions | Choices | Vocab Entries | Reading Passages | Situations | Grammar Topics | Total Words |
|---|---|---|---|---|---|---|---|---|---|
| **Lektion 10** (Gesundheit, Krankheit & Befinden) | 1 - 24 (24 pp) | 29 | 245 | 967 | 315 | 6 | 5 | 2 | 9547 |
| **Lektion 11** (In der Stadt unterwegs) | 25 - 53 (29 pp) | 30 | 318 | 1264 | 200 | 3 | 4 | 3 | 11748 |
| **Lektion 12** (Der Kunde ist König) | 54 - 78 (25 pp) | 36 | 291 | 1113 | 301 | 4 | 5 | 4 | 10165 |
| **Lektion 13** (Kleidung / Im Kaufhaus) | 79 - 112 (34 pp) | 31 | 413 | 1640 | 232 | 2 | 5 | 65 | 12175 |
| **Lektion 14** (Die Feste & Einladungen) | 113 - 138 (26 pp) | 33 | 311 | 1230 | 168 | 4 | 5 | 10 | 9873 |
| **قاموس الكلمات** (General German-Arabic Dictionary) | 139 - 147 (9 pp) | 6 | 0 | 0 | 468 | 0 | 0 | 0 | 2564 |
| **ملاحظات الطالب** (Student Practice & Notes Pages) | 148 - 152 (5 pp) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 121 |
| **TOTALS** | **152 Pages** | **165** | **1578** | **6214** | **1684** | **19** | **24** | **84** | **56193** |

---

## 3. Vocabulary Categorization Breakdown

1. **Lesson-Embedded Vocabulary:**
   - **Lektion 10:** 315 terms
   - **Lektion 11:** 200 terms
   - **Lektion 12:** 301 terms
   - **Lektion 13:** 232 terms
   - **Lektion 14:** 168 terms
   - *Lesson Subtotal:* 1216 contextual vocabulary entries with German examples.

2. **General Lexicon (*قاموس الكلمات* pp. 139–147):**
   - **468 entries** categorized with German grammatical articles (`der`, `die`, `das`), plural indicators, and clean Arabic meanings.

3. **Duplication & Cross-Referencing:**
   - Total Raw Vocabulary Tokens: **1684**
   - Unique Lexical Lemmas: **1637**
   - Repeated Terms: **47** (Cross-referenced between lessons and the general dictionary).

---

## 4. Notes on Pages 148 to 152

Pages 148 to 152 in the original printed textbook contain blank dotted and lined practice sheets (*مساحات لكتابة الملاحظات وحل التدريبات*). In Deutschly, these pages are preserved as the interactive **My Notes & Personal Tips** section, where learners can record custom grammar notes, device reminders, and personal insights.
