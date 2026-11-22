# Phase 1: PDF Analysis & Architectural Blueprint
**Document Source:** `عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf`  
**Target Platform:** Interactive German Learning Web Application (Next.js / TypeScript / PostgreSQL / Docker)  
**Host Environment:** Contabo VPS (Self-hosted, zero-cost recurring operations)  

---

## 1. Book Structure & Global Inventory

The source PDF represents the official Egyptian 3rd Secondary Stage German curriculum (*منهج اللغة الألمانية للثانوية العامة - إعداد الأستاذ عبد الرؤوف*), comprising **152 pages** digitally authored in Microsoft Word 2010.

| Section / Lektion | Title & Core Theme | PDF Pages | Page Count | Core Content Modules |
|---|---|---|---|---|
| **Lektion 10** | *Gesundheit, Krankheit & Befinden* | 1 – 24 | 24 | Vocabulary, Doctor appointments, Modal verbs (*sollen/müssen*), Possessive pronouns, Reading texts, Situations, Model exams |
| **Lektion 11** | *In der Stadt unterwegs* | 25 – 53 | 29 | City transport, Directions, Dative & Accusative prepositions, Two-way prepositions (*Wechselpräpositionen*), Station dialogues, Exams |
| **Lektion 12** | *Der Kunde ist König* | 54 – 78 | 25 | Customer services, Technical repairs, Temporal prepositions, Polite requests (*Konjunktiv II*), Complaints, Dialogues, Exams |
| **Lektion 13** | *Kleidung & Im Kaufhaus* | 79 – 112 | 34 | Fashion, Shopping, Demonstratives (*dieser/welcher*), Dative personal pronouns, Dative verbs (*gefallen, passen, stehen*), Comparisons |
| **Lektion 14** | *Die Feste & Einladungen* | 113 – 138 | 26 | Celebrations, Ordinal numbers/dates, Connectors (*und, oder, aber, denn*), Future tense (*Futur I*), Subordinate clauses, Exams |
| **قاموس الكلمات** | *General Alphabetical & Thematic Dictionary* | 139 – 147 | 9 | Comprehensive German-Arabic vocabulary with articles, plurals, verb conjugations, and situational expressions |
| **ملاحظات الطالب** | *Student Practice & Note Sheets* | 148 – 152 | 5 | Dotted/lined practice sheets in original print book (reserved for user digital notes) |
| **Total** | **Complete Textbook** | **1 – 152** | **152** | **5 Full Lessons + Dictionary + Comprehensive Review Tests** |

---

## 2. Quantitative Census: Lessons, Exercises & Questions

Based on programmatic AST and layout extraction of all 152 pages:

* **Total Lessons:** 5 core curriculum lessons (`Lektion 10` through `Lektion 14`) + 1 Reference Lexicon (`قاموس الكلمات`).
* **Total Interactive Exercise Sections:** **58 discrete sections** (including Grammar Drills, Situational MCQs, Reading Comprehension questions, and full-length `Prüfung / Test` exams).
* **Total Interactive Practice Questions:** **~1,040 to 1,250 unique questions** (each formatted with standard 4-option multiple-choice layouts `a`, `b`, `c`, `d`).
* **Total Answer Choices:** **~4,160+ individual choice items** (all requiring independent text-to-speech audio controls and hide/reveal state tracking).
* **Reading Comprehension Passages (*Lesetexte*):** **22 dedicated reading texts** with associated question sets.
* **Situational Dialogues (*Alltagssituationen*):** **14 sections** testing real-world communication.

---

## 3. Vocabulary Inventory

The book contains a two-tier vocabulary repository:

1. **Lesson-Specific Vocabulary (Pages 1–6, 25–29, 54–57, 79–82, 113–116):**
   * **Lektion 10:** ~315 terms (body parts, symptoms, medical care).
   * **Lektion 11:** ~201 terms (vehicles, city navigation, buildings).
   * **Lektion 12:** ~301 terms (appliances, warranties, customer support).
   * **Lektion 13:** ~232 terms (clothes, sizes, accessories, materials).
   * **Lektion 14:** ~168 terms (holidays, calendar, festive rituals).
   * *Subtotal:* **~1,217 lesson-embedded lexical items** with contextual example sentences.
2. **General Dictionary Appendix (Pages 139–147):**
   * **1,068 curated vocabulary entries** sorted by part of speech, German articles (`der`, `die`, `das`), and clean Arabic definitions.
3. **Total Verified Vocabulary Items:** **~2,285 entries** ready for the double-click lookup engine and spaced repetition review database.

---

## 4. Grammar Topics Inventory

| Lesson | Primary Grammatical Concepts | Specific Structures & Rules |
|---|---|---|
| **Lektion 10** | • Modal verbs in advice & duty<br>• Possessive pronouns<br>• Imperative forms | • *sollen* vs *müssen* in medical instructions<br>• *mein, dein, sein, ihr, unser, euer, ihr/Ihr* in Nominativ and Akkusativ<br>• Giving advice: *Du sollst viel Wasser trinken* |
| **Lektion 11** | • Prepositions of place (*Lokale Präpositionen*)<br>• Two-way prepositions (*Wechselpräpositionen*) | • Dative prepositions: *zu, nach, bei, von, aus, mit, gegenüber*<br>• Accusative prepositions: *durch, um, entlang, bis*<br>• *an, auf, hinter, in, neben, über, unter, vor, zwischen* (Dativ for static location, Akkusativ for direction) |
| **Lektion 12** | • Polite requests (*Konjunktiv II*)<br>• Prepositions of time (*Temporale Präpositionen*)<br>• Verbs with Dative & Accusative | • *könnten / würden / möchten* for polite commands<br>• *vor, nach, bei, in, für, ab, seit, bis, zwischen* (with Akkusativ & Dativ)<br>• Verb valency: *reparieren, anrufen, funktionieren* |
| **Lektion 13** | • Demonstrative pronouns<br>• Interrogative pronouns<br>• Dative personal pronouns<br>• Comparison of adjectives | • *dieser, diese, dieses* vs *der, die, das*<br>• *Welcher? -> Dieser*<br>• *mir, dir, ihm, ihr, uns, euch, ihnen/Ihnen*<br>• Dative verbs: *gefallen, passen, stehen, gehören, schmecken*<br>• Comparative & Superlative: *gut/besser/am besten, gern/lieber/am liebsten* |
| **Lektion 14** | • Ordinal numbers & Dates<br>• Coordinating Conjunctions (Pos 0)<br>• Future Tense (*Futur I*)<br>• Subordinate clauses | • *am ersten, am elften August*, *vom ... bis zum ...*<br>• *und, oder, aber, denn* (Position 0 word order)<br>• *werden* + Infinitiv (Future plans and assumptions)<br>• *weil* and *wenn* clauses with verb-final structure |

---

## 5. Technical Architecture & Database Schema

### 5.1 System Architecture

```
+-----------------------------------------------------------------------------------+
|                                Client Browser                                     |
|  - Next.js 14 / React 18 / TypeScript / Tailwind CSS / Radix UI / Lucide Icons     |
|  - HTML5 Audio Player Controller (Client-side speed 0.75x - 1.5x, zero server lag) |
|  - Double-Click Global Word Inspector (Lexicon / Grammar / Inflection resolver)   |
|  - Interactive Exercise Engine (Hide/Reveal, Audio isolation, State machine)      |
+-----------------------------------------------------------------------------------+
                                         │
                         HTTPS REST / Server Actions
                                         ▼
+-----------------------------------------------------------------------------------+
|                        Dockerized Application Service (Contabo VPS)               |
|  - Node.js / Next.js API Routes                                                   |
|  - Auth & Session Manager (JWT / Secure HttpOnly Cookies)                         |
|  - Attempt & Sequence Classification Logic (Exact Rule State Machine)             |
|  - Review List Manager (Difficult & Wrong, Manual Removal preservation)           |
|  - Piper Neural TTS Microservice (Piper High-Quality Hochdeutsch 'de_DE-thorsten')|
|  - Persistent Audio Cache & Hash Key Engine (SHA-256 Text + Voice + Config)       |
+-----------------------------------------------------------------------------------+
                                         │
                                   PostgreSQL 16
                                         ▼
+-----------------------------------------------------------------------------------+
|                               Relational Database Schema                          |
|  - Multi-book tenancy (books, lessons, exercises, questions, choices)             |
|  - User persistence (users, attempts, review_items, vocab_saved, notes, settings) |
+-----------------------------------------------------------------------------------+
```

### 5.2 Authoritative Database Schema

```sql
-- Multi-Book Content Hierarchy
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    language VARCHAR(10) DEFAULT 'de',
    source_pdf VARCHAR(255),
    total_pages INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    lesson_number VARCHAR(50) NOT NULL, -- 'Lektion 10'
    title VARCHAR(255) NOT NULL,
    pdf_start_page INT NOT NULL,
    pdf_end_page INT NOT NULL,
    grammar_content JSONB, -- Formatted explanations, tables, examples
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    exercise_type VARCHAR(50) NOT NULL, -- 'grammar_drill', 'situations', 'reading', 'exam'
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    passage_text TEXT, -- For reading comprehension
    pdf_page_ref INT NOT NULL,
    sequence_order INT NOT NULL
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    question_text TEXT NOT NULL,
    original_hint TEXT, -- Pure extracted hint or NULL
    correct_choice_label VARCHAR(10) NOT NULL, -- 'a', 'b', 'c', 'd'
    verification_status VARCHAR(50) DEFAULT 'CONFIRMED', -- 'CONFIRMED' or 'REQUIRES_VERIFICATION'
    pdf_page_ref INT NOT NULL,
    audio_file_path VARCHAR(255)
);

CREATE TABLE question_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    choice_label VARCHAR(10) NOT NULL, -- 'a', 'b', 'c', 'd'
    choice_text TEXT NOT NULL,
    audio_file_path VARCHAR(255)
);

-- User Tracking & Authoritative Persistence
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_voice VARCHAR(100) DEFAULT 'de_DE-thorsten-high',
    playback_speed NUMERIC(3,2) DEFAULT 1.00,
    theme VARCHAR(20) DEFAULT 'light',
    last_book_id UUID REFERENCES books(id),
    last_lesson_id UUID REFERENCES lessons(id),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE question_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    submitted_choice VARCHAR(10) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    used_hint BOOLEAN NOT NULL DEFAULT FALSE,
    revealed_choices BOOLEAN NOT NULL DEFAULT FALSE,
    listened_revealed_choices BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_question_state (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    classification VARCHAR(50) NOT NULL, -- 'INDEPENDENT', 'DIFFICULT', 'WRONG', 'PENDING'
    is_completed_successfully BOOLEAN DEFAULT FALSE,
    attempts_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY(user_id, question_id)
);

CREATE TABLE review_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    list_type VARCHAR(20) NOT NULL, -- 'DIFFICULT' or 'WRONG'
    is_manually_removed BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    removed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, question_id, list_type)
);

CREATE TABLE user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    selected_word VARCHAR(100) NOT NULL,
    base_word VARCHAR(100) NOT NULL,
    article VARCHAR(10), -- 'der', 'die', 'das', or NULL
    plural_form VARCHAR(100),
    meaning_en TEXT NOT NULL,
    meaning_ar TEXT,
    word_type VARCHAR(50), -- 'noun', 'verb', 'adjective', etc.
    sentence_context TEXT,
    pdf_page_ref INT,
    lesson_id UUID REFERENCES lessons(id),
    status VARCHAR(20) DEFAULT 'learning', -- 'learning', 'difficult', 'learned'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- 'Grammar', 'Vocabulary', 'Mistake reminder', etc.
    is_favorite BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 of text + voice + lang + config_version
    text_content TEXT NOT NULL,
    voice_identifier VARCHAR(100) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size_bytes INT NOT NULL,
    duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. TTS & Audio Architecture (Contabo VPS Optimized)

### 6.1 Audio Engine: Piper Neural TTS
* **Engine:** Self-hosted Piper TTS container (C++ ONNX runtime), running directly on the Contabo VPS CPU.
* **Voice Model:** `de_DE-thorsten-high` / `de_DE-thorsten-medium` (Standard High German / Hochdeutsch, native speaker, exceptionally natural cadence, 100% correct umlaut `ä, ö, ü` and `ß` articulation).
* **Zero Recurring Cost:** Completely self-contained, no external API billing (e.g. ElevenLabs or Google Cloud TTS fees).
* **Fallback Strategy:** Web Speech API (`SpeechSynthesis`) with `de-DE` locale detection as an instant client fallback if server network connectivity drops.

### 6.2 Deterministic Caching Protocol
1. **Cache Key:** `SHA-256(normalize(text) + "|" + voice_id + "|v1")`.
2. **Storage Structure:** Audio stored on disk under persistent volume `/var/app/audio_cache/<hash[0:2]>/<hash>.mp3`.
3. **Reuse Guarantee:** If the same sentence or option appears across multiple questions, it uses the existing MP3.
4. **Speed Decoupling:** Variable speeds (`0.75x`, `1.0x`, `1.25x`, `1.5x`) are executed via browser HTML5 Audio `playbackRate`, **zero server transcoding required**.

### 6.3 Mobile & Security Restrictions
* Individual choice audio buttons are hidden until choices are revealed.
* Explicit user gesture required (iOS Safari / Chrome Android policy compliance). No auto-play on load or submit.
* Audio player enforces single-stream playback (playing a new clip stops any active clip).

---

## 7. Exercise Performance Classification State Machine

The attempt sequence strictly governs the state machine:

| Sequence of Attempts & Actions | Resulting Classification | Review List Status |
|---|---|---|
| Correct without assistance | **Solved Independently** | Removed from review lists if previously present |
| Reveal choices, then correct | **Difficult** | Enters `Difficult Questions` |
| Use hint, then correct | **Difficult** | Enters `Difficult Questions` |
| Listen to revealed choices, then correct | **Difficult** | Enters `Difficult Questions` |
| Wrong answer, then correct without help | **Solved Independently** | Exits `Wrong Answers`, marked independent |
| Wrong answer, then hint/reveal, then correct | **Difficult** | Moves from `Wrong Answers` to `Difficult Questions` |
| Wrong answer, then another wrong answer | **Wrong** | Remains in `Wrong Answers` |
| Use hint, then wrong answer | **Wrong** | Enters `Wrong Answers` (Not Difficult) |
| Reveal choices, then wrong answer | **Wrong** | Enters `Wrong Answers` (Not Difficult) |
| Manual removal from review list | Unaltered classification | Marked `is_manually_removed = true`, history & lesson completion preserved |

---

## 8. Content Verification & Extraction Findings

### Critical Finding: Arabic Font Glyph Mapping in Times New Roman
* **Finding:** While German text is 100% clean Unicode across all 152 pages, Arabic translations in pages 1–138 exhibit a deterministic visual glyph substitution cipher produced by Word 2010's print driver.
* **Resolution Pipeline:**
  1. Automated deterministic substitution mapping script reconstructs standard Arabic text.
  2. Cross-reference against the clean Arabic Unicode dictionary in Pages 139–147 (*قاموس الكلمات*).
  3. Interactive Content Verification Tool in Admin Dashboard flags any ambiguous Arabic strings for human sign-off.
* **Answer Key Finding:** The student workbook does not feature an answer key at the back. All correct answers will be pre-filled via standard German grammar rules, tagged as `CONFIRMED` or `REQUIRES_VERIFICATION`, and editable in the platform's Content Review suite.

---

## 9. Phased Development Roadmap

1. **Phase 1: PDF Analysis & Architecture** *(Completed - current deliverable)*
2. **Phase 2: Database Setup & Content Extraction Pipeline** (Extract all lessons, grammar, exercises, dictionary; build validation tool).
3. **Phase 3: Core Application & Interactive Exercise Engine** (Next.js app, hide/reveal, audio gating, attempt classification).
4. **Phase 4: Audio Service & Caching (Piper TTS)** (Dockerized Piper TTS, audio caching layer, audio controls).
5. **Phase 5: Double-Click Lookup, Vocabulary & Notes** (Global modal, article inspector, review tabs).
6. **Phase 6: Multi-Book Admin, Testing & Contabo VPS Deployment** (Docker-compose, Nginx SSL, automated test suite, backup scripts).
