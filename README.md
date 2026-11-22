# Deutschly

> **A comprehensive German learning platform that transforms the Egyptian 3rd Secondary Stage curriculum into an interactive, digital learning experience with native pronunciation, offline vocabulary lookup, on-demand AI hints, and authoritative progress tracking.**

[![Tests](https://img.shields.io/badge/Tests-27%2F27%20Passed-emerald.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](#)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](#)

---

## 🌟 Key Features

1. **Exact Textbook Content Preservation:**
   * 152 pages extracted from the official curriculum (*عبد الرؤوف - منهج اللغة الألمانية للثانوية العامة*).
   * 1,578 interactive practice questions with 6,214 answer choices.
   * 2,306 vocabulary words with German articles (`der`, `die`, `das`), plural forms, and Arabic definitions.

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
   * Shows Option A (Arabic definition & word type) and Option B (German article & plural forms).
   * Automatically disabled on hidden choices to prevent cheating.
   * One-click save to personal Vocabulary Review.

5. **Content Verification & Answer Override Interface:**
   * Inspect questions side-by-side with original scanned PDF pages.
   * User can override any answer, permanently saved as `USER_PROVIDED` with a complete audit trail.

6. **My Tips & Notes:**
   * Personal knowledge base for custom grammar rules, mnemonic devices, and AI-generated study reminders.

---

## 📊 Content Inventory Summary

See [CONTENT_INVENTORY.md](./CONTENT_INVENTORY.md) for full verified details.

| Metric | Verified Count |
|---|---|
| **Total PDF Pages** | **152** |
| **Curriculum Lessons** | **5** (Lektion 10 to 14) |
| **Interactive Exercises** | **165** |
| **Practice Questions** | **1,578** |
| **Answer Choices** | **6,214** |
| **Cataloged Vocabulary Items** | **2,306** |
| **Automated Tests** | **27 / 27 Passed** |

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install
pip3 install gTTS simplemma pytesseract pillow

# 2. Setup Database & Seed 1,578 Questions
npx prisma db push
npm run db:seed

# 3. Run Automated Tests
npm test

# 4. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default accounts:
* **Student:** `student` / `password123`
* **Admin:** `admin` / `password123`

---

## 🐳 Contabo VPS Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Docker Compose, Nginx, SSL, and PostgreSQL instructions.

```bash
docker compose up -d --build
```
