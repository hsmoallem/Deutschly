# Deutschly System Architecture

Deutschly is built as a production-grade, full-stack educational web application designed for interactive language acquisition.

```
+-----------------------------------------------------------------------------------+
|                                Client Browser                                     |
|  - Next.js 14 App Router / React 18 / TypeScript / Tailwind CSS                   |
|  - HTML5 Audio Controller (speed 0.75x - 1.5x, zero server re-transcoding)        |
|  - Global Double-Click Word Lookup Modal (Disabled on hidden answer choices)      |
|  - Interactive Exercise Engine (Hide/Reveal choices, Isolated Audio, Hints)       |
+-----------------------------------------------------------------------------------+
                                         │
                         HTTPS REST / JSON API Endpoints
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Next.js Server & Application Layer                         |
|  - Auth & Session Manager (JWT via HttpOnly secure cookie)                        |
|  - Exercise State Machine (/api/attempts/submit)                                  |
|  - On-Demand AI Hint Generator (/api/hints/generate)                              |
|  - Audio Controller & Cache Engine (/api/audio -> gTTS Python Bridge)             |
|  - Offline Lemma & Lexical Lookup Service (/api/dictionary/lookup -> simplemma)   |
|  - Content Verification & Answer Override Engine (/api/admin/questions)          |
+-----------------------------------------------------------------------------------+
                                         │
                                   Prisma ORM
                                         ▼
+-----------------------------------------------------------------------------------+
|                         Authoritative Relational Database                         |
|  - PostgreSQL 16 (Production Contabo VPS) / SQLite (Local Development)            |
|  - Multi-Book Content Models (Book, Lesson, Exercise, Question, Choice)           |
|  - User Learning State Models (User, Attempt, UserQuestionState, ReviewItem)      |
|  - Content Management & Audit (VocabularyItem, AnswerAuditLog, AiHint)            |
+-----------------------------------------------------------------------------------+
```

---

## 1. Key Architectural Design Decisions

### 1.1 Audio Architecture & Playback Speed Decoupling
* **Engine:** Google Translate German Text-to-Speech via `gTTS` Python library.
* **Cost:** 100% free, zero external API subscription fees.
* **Deterministic Caching:** Every unique phrase is hashed using `SHA-256(normalized_text + "_de_v1")` and stored in `public/audio_cache/<hash>.mp3`. Subsequent requests are served from disk.
* **Playback Speed Scaling:** Playback speeds (0.75x, 1.0x, 1.25x, 1.5x) are executed client-side via HTML5 Audio `playbackRate`, completely eliminating redundant audio re-generation on the server.
* **Fallback:** Browser Web Speech API (`SpeechSynthesis`) with `de-DE` locale fallback.

### 1.2 Offline Lexical Lookup & Morphological Lemmatization
* **Lemmatizer:** `simplemma` Python morphological analyzer running offline without external network dependencies.
* **Lexical Database:** 2,306 curated vocabulary entries from the textbook containing German grammatical articles (`der`, `die`, `das`), plural indicators, Arabic translations, and example sentences.
* **Security & Cheating Prevention:** Dictionary lookup is strictly disabled on hidden answer choices until the student explicitly clicks "Reveal Answer Choices".

### 1.3 Answer Verification & Audit Lifecycle
* **Initial State:** All 1,578 questions are assigned an initial `AI_CHECKED` answer deduced through German grammar rules.
* **Flagging:** Context-dependent reading comprehension items or ambiguous options are marked `isFlaggedForReview = true`.
* **Human Override:** Through the Content Verification view, the user can review the question side-by-side with the original scanned PDF page and override any answer. The status transitions to `USER_PROVIDED` and an entry is written to `AnswerAuditLog`.
