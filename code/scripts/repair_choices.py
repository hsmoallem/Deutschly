#!/usr/bin/env python3
"""Repair malformed answer choices.

The seed glued trailing page text onto one choice per affected question, and left a
few choices empty. Examples of the damage:

    "ist d - sind Die Die Modalverben <arabic> ..."     should read "sind"
    "Aus dem Iran. ============= Hallo Mary, Lamis ..."  should read "Aus dem Iran."
    "lesen ......................."                      should read "lesen"

The real option is always at the start, so the repair cuts at the first sign of
bleed-through: Arabic characters, separator runs, long dot runs, wide gaps, or a
section heading. Anything that ends up empty is reported rather than guessed at,
because inventing an option would corrupt a question.
"""
import re
import sqlite3

DB = "/var/www/deutschly/code/prisma/dev.db"
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
CUTTERS = [
    ARABIC,
    re.compile(r"={3,}"),
    re.compile(r"\.{4,}"),
    re.compile(r"[\u2026]{2,}"),
    re.compile(r"\s{3,}"),
    re.compile(r"\bDie Modalverben\b"),
    re.compile(r"\bAlltagssituationen\b"),
    re.compile(r"\bPossessivpronomen\b"),
    re.compile(r"\bTexterfassung\b"),
    re.compile(r"\bW\u00e4hle die richtige Antwort\b"),
]
TRIM = " \t.,;:-\u2013\u2026\u00ab\u00bb\"'"


def repair(text):
    t = (text or "").replace("\u00a0", " ")
    cut = len(t)
    for c in CUTTERS:
        m = c.search(t)
        if m and m.start() < cut:
            cut = m.start()
    t = t[:cut]
    t = re.sub(r"\s{2,}", " ", t).strip().strip(TRIM)
    return t


def is_malformed(text):
    t = text or ""
    return t.strip() == "" or len(t) > 150 or bool(ARABIC.search(t))


def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    rows = cur.execute("""
        SELECT c.id, c.choiceLabel, c.choiceText, q.questionNumber, q.pdfPageRef, q.questionText
        FROM Choice c JOIN Question q ON q.id = c.questionId
    """).fetchall()

    fixed, emptied, untouched = [], [], 0
    for cid, label, text, qnum, page, qtext in rows:
        if not is_malformed(text):
            untouched += 1
            continue
        new = repair(text)
        if not new:
            emptied.append((page, qnum, label, qtext))
            continue
        cur.execute("UPDATE Choice SET choiceText = ? WHERE id = ?", (new, cid))
        fixed.append((page, qnum, label, text, new))

    db.commit()

    print(f"choices checked        : {len(rows)}")
    print(f"already well formed    : {untouched}")
    print(f"repaired               : {len(fixed)}")
    print(f"still empty, not fixed : {len(emptied)}")
    print("")
    print("sample repairs:")
    for page, qnum, label, old, new in fixed[:12]:
        print(f"  p{page:<4} q{qnum:<3} ({label})  {old[:52]!r}  ->  {new!r}")
    if emptied:
        print("")
        print("still empty, left alone rather than guessed:")
        for page, qnum, label, qtext in emptied:
            print(f"  p{page:<4} q{qnum:<3} ({label})  question: {(qtext or '')[:70]}")


if __name__ == "__main__":
    main()
