# Deutschly Product Requirements Document

| Field | Value |
| --- | --- |
| Product | Deutschly |
| Version | 1.0 |
| Status | Live, content accuracy under review |
| Live URL | https://deutschly.houssammoallem.com |
| Source material | Arabic German textbook, 152 pages, grade 12 |

---

## 1. Problem

The German curriculum for the Egyptian secondary certificate is a 152 page printed book:
word lists, grammar explanations and several hundred multiple choice questions per
lesson. A learner working from paper cannot easily practise repeatedly, cannot hear the
words, cannot track which questions they keep getting wrong, and cannot look up a word
without leaving the page.

Deutschly turns that book into a practice application. The book remains the source of
truth. The application exists to drill it, not to replace it or to invent new material.

---

## 2. Users

**Primary user, the learner.** A grade 12 student preparing for the German exam, Arabic
speaker, studying alone on a phone or laptop. They want to work through one lesson at a
time, understand the words first, then the grammar, then answer questions and see what
they got wrong.

**Secondary user, the administrator.** Manages accounts and question content. Only one
administrator account exists today.

---

## 3. Goals

1. Let a learner complete a full lesson from the book in one sitting, in the natural
   study order: words, then grammar, then exercises.
2. Make every question in the book available for practice, with immediate feedback and an
   explanation.
3. Show the Arabic meaning of any German word without leaving the exercise.
4. Track progress per lesson and per question, and surface what needs revisiting.
5. Mirror the book exactly. Nothing added, nothing paraphrased, nothing invented.

---

## 4. Non goals

- Creating new exercises, texts or grammar explanations not present in the book.
- Translation of the whole book or of whole sentences.
- Social features, leaderboards, or sharing between learners.
- Mobile native applications. The web app is responsive instead.
- Multiple languages of the interface. Arabic and German only.
- Paid subscriptions or payments.

---

## 5. Content scope

Five lessons, plus a dictionary section and a student notes section, mapped to the book
page ranges:

| Section | Pages | Vocabulary | Questions |
| --- | --- | --- | --- |
| Lektion 10, Gesundheit, Krankheit & Befinden | 1 to 24 | 247 | 245 |
| Lektion 11, In der Stadt unterwegs | 25 to 53 | 181 | 318 |
| Lektion 12, Der Kunde ist König | 54 to 78 | 190 | 291 |
| Lektion 13, Kleidung / Im Kaufhaus | 79 to 112 | 153 | 413 |
| Lektion 14, Die Feste & Einladungen | 113 to 138 | 118 | 311 |
| قاموس الكلمات, dictionary | 139 to 147 | 951 | 0 |
| ملاحظات الطالب, notes | 148 to 152 | 0 | 0 |
| **Total** | **152** | **1,840** | **1,578** |

Each lesson contains three content blocks taken from the book: the word list, the grammar
explanation, and the exam section made of reading comprehension, everyday situations and
grammar questions.

---

## 6. Functional requirements

### 6.1 Lesson and study flow

- **FR 1.** A lesson page opens on the lesson vocabulary, so every session starts with
  the word review.
- **FR 2.** Sections are ordered vocabulary, grammar, exercises, reading texts, everyday
  situations, and remain reachable at any time through tabs.
- **FR 3.** The lesson header shows the lesson title, its book page range, the question
  count and the completion percentage.

### 6.2 Vocabulary

- **FR 4.** Each entry shows article, German word, Arabic meaning, plural form and the
  example sentence from the book, with the book page it came from.
- **FR 5.** Entries can be filtered by article and searched.
- **FR 6.** A word can be saved to the learner's personal vocabulary list.

### 6.3 Grammar

- **FR 7.** Each grammar topic shows its German title, its Arabic title, the book page,
  the explanation, the rules and worked examples.

### 6.4 Exercises

- **FR 8.** Questions are grouped by the block they came from and display their source
  page.
- **FR 9.** A question can be answered by selecting one of up to four choices.
- **FR 10.** Answering gives immediate feedback and, on request, an explanation.
- **FR 11.** Reading comprehension questions display the passage above the questions.
- **FR 12.** Questions can be filtered by all, open, needs help, wrong and solved.
- **FR 13.** Wrong answers can be retried without losing completion already earned.
- **FR 14.** A question can be marked as difficult manually.

### 6.5 Dictionary lookup

- **FR 15.** Double clicking a German word in any exercise opens a lookup popup.
- **FR 16.** The popup shows the base form, the article, the Arabic meaning and the
  example sentence if known.
- **FR 17.** The looked up word can be saved to the review list.

### 6.6 Progress, review and notes

- **FR 18.** Progress per lesson and overall is persisted per user.
- **FR 19.** A review list holds saved words and flagged questions.
- **FR 20.** Notes can be written per lesson and persist per user.
- **FR 21.** Statistics show counts of solved, wrong, difficult and pending questions.

### 6.7 Accounts

- **FR 22.** Users sign in with email and password, passwords stored hashed.
- **FR 23.** Sessions are carried by a signed token.
- **FR 24.** An administrator can manage questions.

---

## 7. Non functional requirements

- **NFR 1.** Responsive from 360 px width upward. Arabic renders right to left with a
  dedicated font.
- **NFR 2.** Pages render server side where content is static, and dynamically where it
  depends on the database.
- **NFR 3.** Served over HTTPS only, with HSTS and standard security headers.
- **NFR 4.** Survives a reboot: systemd unit enabled with automatic restart.
- **NFR 5.** Single VPS, no external service dependencies other than Cloudflare in front.
- **NFR 6.** Backup is a single database file copy.

---

## 8. Acceptance criteria

The product is correct when all of the following hold:

1. Opening any lesson lands on the vocabulary, and the tab order is words, grammar,
   exercises, reading, situations.
2. The five lessons contain 1,578 questions between them, and each question text is
   traceable to the book page it cites.
3. Every answer choice exists in the book at that page.
4. Every vocabulary entry exists in the book at its cited page, with its example
   sentence reproduced as printed.
5. Reading texts in the app are the book's own texts, not rewrites.
6. Grammar content corresponds to the book. Where the wording is authored, it is labelled
   as authored rather than presented as the book's.
7. The word lookup popup always returns a real Arabic meaning, or an explicit not found
   state, never a placeholder presented as a definition.
8. 90 days of operation without manual intervention beyond package updates.

Criteria 2 to 6 are the subject of `CONTENT_AUDIT.md` and currently fail at criteria 5
and 6, with partial failures at 3 and 4.

---

## 9. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Authored content presented as the book's | Learners study material that is not on the exam | Content audit, then replace with extracted text |
| Default admin password in a public repo | Anyone can administer the site | Rotate immediately and remove from the repository |
| SQLite single file | Corruption or loss loses everything | Scheduled copy plus versioned seed scripts |
| PDF not in the repository | Content cannot be re-derived | Store the source PDF beside the app |
| Arabic meanings truncated in the source data | Wrong translations taught | Review the short entries and correct them |

---

## 10. Open questions

1. Should the authored grammar be replaced by the book's own Arabic explanations, or kept
   and labelled as supplementary?
2. Should the five written reading passages be removed, or replaced by the book's own
   texts for those pages?
3. Is the dictionary section of 951 entries meant to be browsable as a dictionary, or only
   as a lookup source?
4. Should learner accounts be self service with email verification, or created by the
   administrator only?
