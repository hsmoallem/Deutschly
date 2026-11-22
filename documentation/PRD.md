# Product Requirements Document (PRD)
# Deutschly: Interactive German Learning Platform (PDF-to-Web)

**Document Version:** 1.0.0  
**Target Platform:** Web (Desktop, Tablet, Mobile)  
**Status:** In Production / Active Development  
**Repository:** [https://github.com/hsmoallem/Deutschly](https://github.com/hsmoallem/Deutschly)

---

## 1. Executive Summary & Product Vision

**Deutschly** is an interactive, full-stack language learning web platform designed to transform printed and scanned German curriculum textbooks into structured, pedagogically sound, and interactive digital learning experiences.

The primary launch curriculum is the 152-page textbook:
*منهج اللغة الألمانية للصف الثالث الثانوي – الأستاذ عبد الرؤوف ومنة الله رمضان (طبعة 2027)*.

Rather than summarizing, paraphrasing, or altering the material, Deutschly maintains a **100% fidelity commitment** to the original physical textbook. It augments the raw textbook material with intelligent interactive features:
- Dual-mode German voice synthesis with automated server-side caching.
- Instant, non-destructive offline lemmatization and lexical lookup.
- Strict anti-guessing audio and choice gating.
- Intelligent, pedagogical AI hints.
- Precise multi-state question tracking (Solved Independently, Difficult, Wrong).
- Full administrative content verification with side-by-side original PDF page scans.

---

## 2. Core Principle: Absolute Content Preservation

The physical PDF textbook is the **single source of truth**. Deutschly maintains two strictly separated layers:

1. **Original Book Content Layer:**
   - Exact German vocabulary, articles (`der`, `die`, `das`), and plural suffixes.
   - Exact Arabic translations, grammar rules, notes, and exercises.
   - Exact questions, numbers, options, and order.
   - Verbatim punctuation, capitalization, umlauts (`ä`, `ö`, `ü`), and `ß`.
   - Never modified, modernized, corrected, or paraphrased.
   - Scanned page references linked to every question, exercise, and vocabulary item.

2. **Additional Learning Layer (Enrichment):**
   - On-demand AI hints (labeled `AI Hint`) that never reveal the answer directly.
   - Offline lemma resolution (via `simplemma`).
   - High-fidelity German TTS audio.
   - Performance analytics and spaced review scheduling.

---

## 3. Verified Content Census

The launch curriculum contains exactly:
- **Total Pages:** 152
- **Curriculum Units:** 7 units (5 Curriculum Lessons + 1 General Lexicon + 1 Practice Section)
  - *Lektion 10:* Pages 1–24 (28 exercises, 283 questions, 452 vocab)
  - *Lektion 11:* Pages 25–53 (32 exercises, 333 questions, 442 vocab)
  - *Lektion 12:* Pages 54–78 (26 exercises, 274 questions, 376 vocab)
  - *Lektion 13:* Pages 79–112 (37 exercises, 363 questions, 494 vocab)
  - *Lektion 14:* Pages 113–138 (34 exercises, 325 questions, 542 vocab)
  - *قاموس الكلمات (General Lexicon):* Pages 139–147 (8 exercises, 0 questions, 1,210 dictionary words)
  - *تدريبات إضافية وملاحظات (Student Practice):* Pages 148–152
- **Total Exercises:** 165
- **Total Questions:** 1,578
- **Total Answer Choices:** 6,214
- **Total Vocabulary Items:** 2,306

---

## 4. User Personas & Roles

### 4.1. Student (`student`)
- **Needs:** Master German secondary school curriculum, practice grammar and reading comprehension, track mastery, review mistakes, listen to correct German pronunciation.
- **Capabilities:**
  - Complete exercises and submit answers.
  - Listen to audio for questions and revealed choices.
  - Request AI hints and double-click words for instant dictionary lookup.
  - Review and retry questions in "Difficult Questions" and "Wrong Answers" lists.
  - Create personal notes and bookmark vocabulary items.
  - Customize playback speed, audio voice, and theme.

### 4.2. Teacher / Admin (`admin`)
- **Needs:** Verify question accuracy, inspect original scanned PDF pages, correct AI-deduced answers, resolve ambiguous reading questions.
- **Capabilities:**
  - All Student features.
  - Access `/admin` dashboard.
  - Side-by-side comparison of extracted text and original high-resolution PDF page crops.
  - Edit question text, choices, and correct answers (automatically tagged as `USER_PROVIDED`).
  - Flag or resolve questions for review.
  - Full audit logging of all modifications.

---

## 5. Pedagogical Architecture & Completion Logic

### 5.1. Lesson Completion Criteria
A lesson is **never** completed merely by reading content or attempting exercises. A lesson achieves `COMPLETED` status if and only if:
1. Every exercise in the lesson has been attempted.
2. Every question in every exercise has been answered correctly at least once.
3. Every question has an active state of `SOLVED_INDEPENDENTLY` or `DIFFICULT`.

### 5.2. Attempt Classification State Machine
When a student submits an answer to a question, the system classifies the attempt into one of three discrete categories based on a strict deterministic matrix:

| Condition | Classification | System Actions |
| :--- | :--- | :--- |
| **Correct on 1st try without hints or reveal** | `SOLVED_INDEPENDENTLY` | Marks question mastered; removes from Difficult and Wrong lists if previously listed. |
| **Correct after opening AI Hint or revealing choices** | `DIFFICULT` (Needed Help) | Marks question passed with assistance; automatically adds to `Difficult Questions` list; increments helper counters. |
| **Incorrect answer (any circumstances)** | `WRONG` | Marks question failed; automatically adds to `Wrong Answers` list; blocks lesson completion until resolved. |
| **Incorrect, then subsequently solved without help** | `SOLVED_INDEPENDENTLY` | Automatically evicts from `Wrong Answers` list; promotes question status to mastered. |

### 5.3. Review Lists Governance
- **Difficult Questions List:**
  - Automatically populated whenever a question is answered correctly with assistance (`usedHint === true` or `revealedChoices === true`).
  - Questions remain in the list until either:
    1. The student answers the question correctly *without assistance* in a subsequent retry.
    2. The student manually dismisses the question from the list.
- **Wrong Answers List:**
  - Automatically populated whenever an incorrect choice is submitted.
  - Evicted only when answered correctly.
  - Can also be manually cleared by the user.

---

## 6. Interactive Exercise Engine

### 6.1. Audio Anti-Guessing Protocol
To encourage authentic reading and listening comprehension rather than brute-force guessing:
1. **Initial State:** Answer choices are hidden or collapsed by default.
2. **Audio Gating:** The audio button next to a choice is **disabled** while that choice is hidden.
3. **Assistance Penalty:** Revealing answer choices before attempting the question is recorded as an assistance action (`revealedChoices = true`).

### 6.2. Double-Click Lexical Lookup
- Any German word in questions, instructions, or reading passages can be double-clicked.
- A modal displays:
  - Base lemma (e.g., *Häusern* $\to$ *das Haus*).
  - Grammatical gender (`der`, `die`, `das`) and plural marker.
  - Part of speech.
  - Textbook Arabic translation and example sentence.
- **Anti-Cheat Rule:** Double-click lookup is completely disabled on hidden choices to prevent previewing answers.

---

## 7. Dual Audio Engine & Caching Protocol

1. **Primary Voice (Server-Side):**
   - Free Google Translate TTS German engine (`gTTS`, language `de`).
   - Audio files are stored in `public/audio_cache/[sha256(text)].mp3`.
   - Before generation, the server performs a cache lookup; cache hits return the static asset immediately (0ms generation overhead).
2. **Fallback Voice (Client-Side):**
   - HTML5 Web Speech Synthesis API (`window.speechSynthesis`), utilizing the client's native `de-DE` voice engine if the server audio endpoint is unreachable.
3. **Playback Speed Decoupling:**
   - Audio playback rate (0.75x, 1.0x, 1.25x, 1.5x) is controlled purely via client-side HTML5 Audio `playbackRate`.
   - Speed adjustment never triggers re-synthesis, conserving network bandwidth and server resources.

---

## 8. AI Hints Architecture

- Hints are generated on demand via `/api/hints/generate`.
- **Pedagogical Constraints:**
  - Must be clearly labeled **"AI Hint"**.
  - Must explain relevant grammar rules, declensions, or sentence context.
  - **Never** state the answer or eliminate choices directly.
  - Requesting an AI hint immediately marks the attempt as assisted (`usedHint = true`).

---

## 9. Answer Governance & Verification Protocol

Since the source workbook does not contain a printed answer key:
1. **Initial Deduction:** All 1,578 questions were deduced through strict German grammar and contextual analysis, saved with status `AI_CHECKED`.
2. **Ambiguity Flagging:** Questions with ambiguous context or complex reading comprehension were flagged (`isFlagged = true`, 185 questions flagged).
3. **Human Review in Admin Panel:**
   - Admins inspect the high-resolution crop of the original textbook page alongside the digital question.
   - Any modification made by a human changes the answer status to `USER_PROVIDED`.
   - Every modification is permanently recorded in the `AnswerAuditLog` table with timestamp, user ID, previous answer, new answer, and review notes.

---

## 10. Multi-User Architecture & Persistence

- **Authentication:** Session cookie with bcrypt password hashing.
- **Database Schema (Prisma ORM):**
  - Multi-user isolation: Every `Attempt`, `UserQuestionState`, `ReviewItem`, `UserVocabulary`, and `UserNote` is scoped strictly to `userId`.
  - Seamless support for SQLite (local development) and PostgreSQL (production).
- **Default Accounts:**
  - Student: `username: student`, `password: password123`
  - Admin: `username: admin`, `password: password123`

---

## 11. Responsive UX & UI Design

- Designed with Tailwind CSS and Lucide React.
- Modern, clean, distraction-free interface optimized for language acquisition.
- Fully responsive across Desktop (1440px+), Tablet (768px–1024px), and Mobile (<768px).
- Dark and Light theme support via `UserSettings`.
- Navigation state preserved across sessions.
