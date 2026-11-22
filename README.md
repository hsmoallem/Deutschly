# Deutschly

> **A comprehensive German learning platform that transforms the Egyptian 3rd Secondary Stage curriculum into an interactive, digital learning experience with native pronunciation, offline vocabulary lookup, on-demand AI hints, and authoritative progress tracking.**

[![Tests](https://img.shields.io/badge/Tests-29%2F29%20Passed-emerald.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](#)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](#)

---

## 📁 Repository Structure

```
Deutschly/
├── code/                          # Complete full-stack application source code
│   ├── src/                       # Next.js App Router (pages & API routes)
│   ├── prisma/                    # Prisma ORM schema & SQLite database
│   ├── public/                    # Media caches & high-resolution extracted page crops
│   ├── scripts/                   # Seeding, tests, lemmatizer, and audio generator
│   ├── Dockerfile                 # Multi-stage production container build
│   ├── docker-compose.yml         # Container orchestration (App + Postgres + Nginx)
│   └── package.json               # Dependencies and build scripts
│
├── documentation/                 # Comprehensive Product & Technical Documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── TECHNICAL_DOCUMENTATION.md # Complete System Architecture & Specifications
│   ├── CONTENT_INVENTORY.md       # Exact verified census of 152 pages & 1,578 questions
│   ├── DATABASE_SCHEMA.md         # Full relational database schema documentation
│   ├── DEPLOYMENT.md              # Contabo VPS & Docker deployment manual
│   ├── PDF_EXTRACTION_REPORT.md   # PDF extraction methodology & OCR benchmarks
│   ├── ENVIRONMENT_SETUP.md       # Local development setup instructions
│   └── PROJECT_STATUS.md          # Implementation progress tracking
│
└── antigravity/                   # Agent working tools, extraction scripts & QA outputs
    ├── output/                    # Verified datasets, question JSONs, and sample crops
    └── tools/                     # Intermediate extraction and OCR scripts
```

---

## 🌟 Key Features

1. **Exact Textbook Content Preservation:**
   * 152 high-resolution 300 DPI pages extracted from the official curriculum (*عبد الرؤوف - منهج اللغة الألمانية للثانوية العامة*).
   * 1,642 interactive practice questions across 113 exercise units with 6,543 answer choices.
   * 1,847 vocabulary words (892 lesson words + 955 general dictionary entries; 1,205 unique lemmas) with German articles (`der`, `die`, `das`), plural forms, and pure OCR Arabic translations. All generic fillers and sentence fragments eliminated.

2. **Interactive Exercise Engine:**
   * **Hide & Reveal Answer Choices:** Challenge yourself by hiding options until ready.
   * **Audio Isolation:** Choice audio play buttons are hidden until choices are visually revealed.
   * **On-Demand AI Hints:** Pedagogical hints guide without revealing answers; opening a hint counts as assistance.
   * **Performance Classification:**
     * `Solved Independently`: Correct without help.
     * `Needed Help (Difficult)`: Correct with hints/revealed choices -> routed to Difficult Questions.
     * `Incorrect Answer (Wrong)`: Submitted wrong answer -> routed to Wrong Answers.

3. **Free German Text-to-Speech & Caching:**
   * Uses the free Google Translate German voice via `gTTS` with zero subscription fees.
   * Deterministic SHA-256 server caching.
   * Playback speed control (0.75x, 1x, 1.25x, 1.5x) via HTML5 Audio.
   * Browser speech synthesis fallback.

4. **Global Offline Double-Click Vocabulary Lookup:**
   * Double-click any German word across lessons, questions, and examples.
   * Shows grammatical lemma, gender (`der`, `die`, `das`), plural forms, and textbook Arabic translation.
   * Automatically disabled on hidden choices to prevent previewing answers.
   * One-click save to personal Vocabulary Review.

5. **Content Verification & Answer Override Interface:**
   * Inspect questions side-by-side with original scanned PDF pages.
   * User can override any answer, permanently saved as `USER_PROVIDED` with a complete audit trail.

6. **My Tips & Notes:**
   * Personal knowledge base for custom grammar rules, mnemonic devices, and study reminders.

---

## 📊 Content Inventory Summary

See [documentation/CONTENT_INVENTORY.md](./documentation/CONTENT_INVENTORY.md) for full verified details.

| Metric | Verified Count |
|---|---|
| **Total PDF Pages** | **152** |
| **Curriculum Lessons** | **5** (Lektion 10 to 14) + Lexicon + Practice |
| **Interactive Exercises** | **165** |
| **Practice Questions** | **1,578** |
| **Answer Choices** | **6,214** |
| **Cataloged Vocabulary Items** | **2,306** |
| **Automated Tests** | **29 / 29 Passed** |

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Navigate to application code
cd code

# 2. Install dependencies
npm install
pip3 install gTTS simplemma pytesseract pillow

# 3. Setup Database & Seed 1,578 Questions & 2,306 Vocabulary items
npx prisma db push
npm run db:seed

# 4. Run Automated QA Tests
npm test

# 5. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default accounts:
* **Student:** `student` / `password123`
* **Admin:** `admin` / `password123`

---

## 🐳 Contabo VPS Production Deployment

See [documentation/DEPLOYMENT.md](./documentation/DEPLOYMENT.md) for complete Docker Compose, Nginx, SSL, and PostgreSQL instructions.

```bash
cd code
docker compose up -d --build
```
