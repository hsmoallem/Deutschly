#!/usr/bin/env python3
"""Set the six choices that truncation could not recover, using the book's own text.

Each value below was read off the PDF page for that question, for example page 8
question 21 prints "a - seid / b -sehen c -ist d - sind", so choice c is "ist".
"""
import sqlite3

DB = "/var/www/deutschly/code/prisma/dev.db"

FIXES = [
    # (pdf page, question number, choice label, correct text, book evidence)
    (8, 21, "c", "ist", "p8: a - seid | b -sehen c -ist d - sind"),
    (34, 5, "d", "zu", "p34: a - bei b -in c -nach d -zu"),
    (9, 16, "a", "soll", "p9: a- soll b-musst c-möchtet d-sollt"),
    (37, 12, "c", "zur", "p37: a - ins b -in der c- zur d-nach"),
    (37, 15, "b", "in die", "p37: a - in der b - in die c -im d -in den"),
    (72, 5, "b", "Martina.", "p72: A- Boris. B- Martina. C- Niemand. D- A und B"),
]

db = sqlite3.connect(DB)
cur = db.cursor()

for page, qnum, label, text, evidence in FIXES:
    rows = cur.execute("""
        SELECT c.id, c.choiceText FROM Choice c
        JOIN Question q ON q.id = c.questionId
        WHERE q.pdfPageRef = ? AND q.questionNumber = ? AND c.choiceLabel = ?
    """, (page, qnum, label)).fetchall()
    if not rows:
        print(f"  p{page} q{qnum} ({label}): NO MATCH")
        continue
    for cid, old in rows:
        cur.execute("UPDATE Choice SET choiceText = ? WHERE id = ?", (text, cid))
        print(f"  p{page:<4} q{qnum:<3} ({label})  {old[:40]!r}  ->  {text!r}")
        print(f"        evidence {evidence}")

db.commit()

# report anything still malformed
import re
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
bad = cur.execute("""
    SELECT q.pdfPageRef, q.questionNumber, c.choiceLabel, c.choiceText
    FROM Choice c JOIN Question q ON q.id = c.questionId
""").fetchall()
left = [r for r in bad if not (r[3] or "").strip() or len(r[3] or "") > 150 or ARABIC.search(r[3] or "")]
print("")
print("choices still malformed afterwards:", len(left))
for r in left:
    print("   p" + str(r[0]) + " q" + str(r[1]) + " (" + r[2] + ") " + repr((r[3] or "")[:60]))
