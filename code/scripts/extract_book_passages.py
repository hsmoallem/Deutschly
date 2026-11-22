#!/usr/bin/env python3
"""Extract the book's own reading texts so the app can stop showing written ones.

Targets the Texterfassung blocks: a heading such as
    I. Texterfassung : A - Lies den folgenden Text!
    Lies den folgenden Text
    Lies bitte die Texte
followed by German prose, then "Wahle die richtige Antwort aus!" and the questions.

Only Latin script lines are kept, because the Arabic in this PDF is a broken font
encoding and comes out as wrong letters. Output is keyed by the page where the text
begins, with the page where the questions begin, so the app can map a reading
exercise to the text its questions belong to.
"""
import json
import re
import subprocess
import sys

PDF = "/home/houssam/deutschly-source/source_textbook.pdf"

LESSONS = [("Lektion 10", 1, 24), ("Lektion 11", 25, 53), ("Lektion 12", 54, 78),
           ("Lektion 13", 79, 112), ("Lektion 14", 113, 138)]

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
LATIN = re.compile(r"[A-Za-z\u00c0-\u017f\u00df]")
Q_LINE = re.compile(r"^\s*\d{1,3}\s*[-)\u2013]")
START_MARK = re.compile(r"texterfassung|lies den folgenden text|lies bitte die texte|"
                        r"lies den text|lesen sie den text", re.I)
START_QUESTS = re.compile(r"w\u00e4hle die richtige antwort", re.I)
NOISE = re.compile(r"^[\s.=_\-]{3,}$")


def is_german(line):
    letters = [c for c in line if c.isalpha()]
    if len(letters) < 15:
        return False
    return sum(1 for c in letters if LATIN.match(c)) / len(letters) > 0.8


def page_lines(p):
    out = subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), PDF, "-"],
                         capture_output=True, text=True).stdout
    return out.splitlines()


def main():
    passages = []
    for name, start, end in LESSONS:
        capturing = False
        buf = []
        start_page = None

        def flush(quests_page):
            nonlocal buf, start_page, capturing
            if buf and start_page is not None:
                text = " ".join(buf)
                text = ARABIC.sub(" ", text)
                text = re.sub(r"\s{2,}", " ", text).strip()
                if len(text) >= 250:
                    passages.append({
                        "lesson": name,
                        "startPage": start_page,
                        "questionsPage": quests_page,
                        "chars": len(text),
                        "text": text,
                    })
            buf = []
            start_page = None
            capturing = False

        for page in range(start, end + 1):
            for line in page_lines(page):
                if NOISE.match(line):
                    continue
                if START_MARK.search(line):
                    if capturing and buf:
                        flush(page)          # a previous block ended without a quest marker
                    capturing = True
                    start_page = page
                    continue
                if START_QUESTS.search(line):
                    if capturing:
                        flush(page)
                    continue
                if Q_LINE.match(line):
                    if capturing:
                        flush(page)
                    continue
                if capturing and is_german(line):
                    buf.append(line.strip())
        if capturing:
            flush(end)

    with open("/home/houssam/book_passages.json", "w", encoding="utf-8") as f:
        json.dump(passages, f, ensure_ascii=False, indent=1)

    print(f"passages found: {len(passages)}")
    for p in passages:
        print(f"  {p['lesson']:<11} text pp{p['startPage']}-{p['questionsPage']:<4} "
              f"{p['chars']:5d} chars  \"{p['text'][:95]}\"")


if __name__ == "__main__":
    main()
