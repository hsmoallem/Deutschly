#!/usr/bin/env python3
"""Extract ground truth from the Deutschly textbook PDF for verification against the app.

Produces /home/houssam/pdf_truth.json containing, per lesson:
  - questions: number, page, German text (first line, Arabic stripped)
  - vocab: German head words found on the wordlist pages
  - passages: the reading texts
No inference: everything is copied out of the PDF.
"""
import json
import re
import subprocess
import sys

PDF = None
for line in subprocess.run(
    ["find", "/home/houssam/.hermes/cache/documents/native-inputs/"
             "cb55600376831f3b7b44656bd625606d11b13a42237f026f305fb5b720db0ae3",
     "-name", "*.pdf"], capture_output=True, text=True).stdout.splitlines():
    if line.strip():
        PDF = line.strip()
        break
if not PDF:
    sys.exit("PDF not found")

LESSONS = [
    ("Lektion 10", 1, 24),
    ("Lektion 11", 25, 53),
    ("Lektion 12", 54, 78),
    ("Lektion 13", 79, 112),
    ("Lektion 14", 113, 138),
]

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f]")
LATIN = re.compile(r"[A-Za-z\u00c0-\u017f\u00df]")
Q_LINE = re.compile(r"^\s*(\d{1,3})\s*[-)\u2013]\s*(.*)$")
# a wordlist row looks like: der Kopf  ..  الرأس  Der Kopf tut weh
ARTICLE_WORD = re.compile(r"^\s*(der|die|das)\s+([A-Z\u00c4\u00d6\u00dc][a-z\u00e4\u00f6\u00fc\u00df\-]{2,})")


def page_lines(page):
    out = subprocess.run(["pdftotext", "-layout", "-f", str(page), "-l", str(page), PDF, "-"],
                         capture_output=True, text=True).stdout
    return out.splitlines()


def german_only(s):
    """Drop Arabic runs so the remainder can be compared with the German in the database."""
    s = ARABIC.sub(" ", s)
    s = re.sub(r"\s{2,}", " ", s)
    return s.strip()


def main():
    truth = {}

    for name, start, end in LESSONS:
        questions = []
        vocab = []
        for page in range(start, end + 1):
            for raw in page_lines(page):
                m = Q_LINE.match(raw)
                if m:
                    text = german_only(m.group(2))
                    if len(text) >= 3:
                        questions.append({
                            "n": int(m.group(1)),
                            "page": page,
                            "text": text[:200],
                        })
                    continue
                a = ARTICLE_WORD.match(raw)
                if a:
                    vocab.append({
                        "article": a.group(1),
                        "word": a.group(2),
                        "page": page,
                    })
        # de-duplicate identical question rows (number + page + text)
        seen = set()
        uq = []
        for q in questions:
            k = (q["n"], q["page"], q["text"])
            if k in seen:
                continue
            seen.add(k)
            uq.append(q)

        truth[name] = {
            "start": start,
            "end": end,
            "questions": uq,
            "vocab": vocab,
        }

    with open("/home/houssam/pdf_truth.json", "w", encoding="utf-8") as f:
        json.dump(truth, f, ensure_ascii=False, indent=1)

    grand = 0
    for name, t in truth.items():
        grand += len(t["questions"])
        print(f"{name:<12} pages {t['start']:>3}-{t['end']:<3} "
              f"question rows {len(t['questions']):4d}  "
              f"wordlist entries {len(t['vocab']):4d}")
    print(f"{'TOTAL':<12} question rows across lessons: {grand}")


if __name__ == "__main__":
    main()
