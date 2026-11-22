# Deutschly Environment Setup Guide

## 1. Local Development Setup

### Prerequisites
* Node.js v20+ or v24+
* Python 3.10+
* Tesseract OCR with `ara` and `deu` language packs (macOS: `brew install tesseract tesseract-lang`)

### Installation
1. Install Node.js packages:
   ```bash
   npm install
   ```

2. Install Python helper dependencies:
   ```bash
   pip3 install gTTS simplemma pytesseract pillow
   ```

3. Initialize local SQLite database:
   ```bash
   npx prisma db push
   npx prisma generate
   npm run db:seed
   ```

4. Run the automated test suite:
   ```bash
   npm test
   ```

5. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Default Test Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| **Student** | `student` | `password123` | Full learning progress tracking |
| **Admin** | `admin` | `password123` | Content verification & answer override |
