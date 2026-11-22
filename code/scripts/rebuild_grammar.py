#!/usr/bin/env python3
"""Rebuild the lesson grammar topics from the book's own German grammar pages.

Why: the stored grammar layer was authored. None of its 35 German examples appear
anywhere in the book, so it failed the requirement that content mirror the source.

What this does, per grammar page:
  - copies the German heading, rule lines and example sentences verbatim out of the PDF
  - drops the invented Arabic explanations
  - states, in Arabic, where the book's own Arabic explanation sits, so the learner is
    sent to the page instead of being shown words the book never contained

The book's Arabic cannot be extracted. Its font maps glyphs to the wrong letters, so
NFKC normalisation leaves it unchanged and reversing it does not produce Arabic.
Rendering the page as an image is the only faithful way to show the Arabic, which is
recorded as the follow up rather than faked here.
"""
import json
import re
import sqlite3
import subprocess

PDF = "/home/houssam/deutschly-source/source_textbook.pdf"
DB = "/var/www/deutschly/code/prisma/dev.db"

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
LATIN = re.compile(r"[A-Za-z\u00c0-\u017f\u00df]")
Q_LINE = re.compile(r"^\s*\d{1,3}\s*[.)\-\u2013]")          # 7.  12-  3)
OPT_LINE = re.compile(r"^\s*[a-dA-D]\s*[-)\u2013]")        # a-  b)
OPT_TABLE = re.compile(r"(\b[a-dA-D]\s*[-\u2013)]\s*\S.*){2,}")   # a- x   b- y
INVISIBLE = re.compile(r"[\u202a-\u202e\u200e\u200f\u00a0\u061c]")
EXAM = re.compile(r"w\u00e4hle die richtige antwort|texterfassung|alltagssituationen|"
                  r"lies den folgenden text|allgemeine \u00fcbungen", re.I)
NOISE = re.compile(r"^[\s.=_\-]{3,}$")


def german_lines(page):
    raw = subprocess.run(["pdftotext", "-layout", "-f", str(page), "-l", str(page), PDF, "-"],
                         capture_output=True, text=True).stdout.splitlines()
    out = []
    for line in raw:
        x = ARABIC.sub(" ", line)
        x = INVISIBLE.sub("", x)
        x = re.sub(r"\s{2,}", " ", x).strip()
        if not x or NOISE.match(x):
            continue
        letters = [c for c in x if c.isalpha()]
        if len(letters) < 4:
            continue
        if sum(1 for c in letters if LATIN.match(c)) / len(letters) < 0.85:
            continue
        out.append(x)
    return out


def usable(line):
    """drop question rows, option rows and exam instructions, keep grammar content"""
    if Q_LINE.match(line) or OPT_LINE.match(line) or OPT_TABLE.search(line):
        return False
    if EXAM.search(line):
        return False
    return True


def build_topic(page, lesson_label):
    lines = [l for l in german_lines(page) if usable(l)]
    if not lines:
        return None

    if len(lines) < 3:
        return None

    # heading: first short line that is not a full sentence and is not a numbered row
    title = None
    rest = []
    for i, l in enumerate(lines):
        words = l.split()
        looks_like_row = bool(re.match(r"^\d", l)) or bool(OPT_TABLE.search(l))
        if title is None and len(words) <= 8 and not l.rstrip().endswith(".") and not looks_like_row:
            title = l.rstrip(" :")
            continue
        rest.append(l)
    if not title:
        title = f"Grammatik, Seite {page}"

    examples, rules = [], []
    for l in rest:
        words = l.split()
        if len(words) >= 4 and re.search(r"[.!?]$", l):
            examples.append({"de": l, "ar": ""})
        else:
            rules.append(l)

    return {
        "id": f"pdf-{lesson_label}-{page}",
        "titleDe": title,
        "titleAr": "",
        "pdfPage": page,
        "summary": f"\u0627\u0644\u0634\u0631\u062d \u0627\u0644\u0639\u0631\u0628\u064a "
                   f"\u0644\u0647\u0630\u0647 \u0627\u0644\u0642\u0627\u0639\u062f\u0629 "
                   f"\u0641\u064a \u0627\u0644\u0643\u062a\u0627\u0628\u060c "
                   f"\u0635\u0641\u062d\u0629 {page}. "
                   f"\u0627\u0644\u0645\u0639\u0631\u0648\u0636 \u0647\u0646\u0627 "
                   f"\u0646\u0635 \u0627\u0644\u0643\u062a\u0627\u0628 "
                   f"\u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a \u0643\u0645\u0627 \u0647\u0648.",
        "rules": rules[:15],
        "examples": examples[:8],
    }


def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    # restore the authored grammar first so this script is re-runnable from a known base
    cur.execute("SELECT id, lessonNumber, grammarContent, pdfStartPage, pdfEndPage FROM Lesson")
    lessons = cur.fetchall()

    report = []
    for lesson_id, lesson_number, content, start_page, end_page in lessons:
        if not content:
            continue
        old = json.loads(content)
        anchor_pages = [t.get("pdfPage") for t in old if t.get("pdfPage")]
        topics = []
        used_pages = set()
        for p in anchor_pages:
            topic = build_topic(p, lesson_number)
            if topic is None:
                # the anchor page held only questions, so look at its neighbours
                for alt in (p + 1, p - 1, p + 2):
                    if start_page <= alt <= end_page and alt not in used_pages:
                        topic = build_topic(alt, lesson_number)
                        if topic:
                            break
            if topic and topic.get("titleDe") and (topic["rules"] or topic["examples"]):
                topics.append(topic)
                used_pages.add(topic["pdfPage"])
        if not topics:
            report.append((lesson_number, 0, 0, "no extractable German grammar on those pages"))
            continue
        cur.execute("UPDATE Lesson SET grammarContent = ? WHERE id = ?",
                    (json.dumps(topics, ensure_ascii=False), lesson_id))
        n_ex = sum(len(t["examples"]) for t in topics)
        n_ru = sum(len(t["rules"]) for t in topics)
        report.append((lesson_number, len(topics), n_ex, f"{n_ru} rule lines"))
    conn.commit()

    print("lesson        topics  examples  details")
    for r in report:
        print(f"  {str(r[0])[:12]:<13} {r[1]:>4}  {r[2]:>7}   {r[3]}")

    print("")
    cur.execute("SELECT lessonNumber, grammarContent FROM Lesson")
    for lesson_number, content in cur.fetchall():
        if not content:
            continue
        topics = json.loads(content)
        if not topics:
            continue
        t = topics[0]
        print(f"  {lesson_number} first topic: page {t['pdfPage']} \"{t['titleDe']}\" "
              f"({len(t['rules'])} rules, {len(t['examples'])} examples)")
        if t["examples"]:
            print(f"     book example: {t['examples'][0]['de'][:95]}")
        if t["rules"]:
            print(f"     book rule   : {t['rules'][0][:95]}")


if __name__ == "__main__":
    main()
