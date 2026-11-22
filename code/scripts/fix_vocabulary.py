#!/usr/bin/env python3
"""Resolve the vocabulary rows that do not trace to their claimed book page.

Two faults exist in the seeded data:
  - OCR artefacts glued onto the headword, such as "g Anschluss" or "g Weg", which can
    never match the book because the real word is "Anschluss"
  - correct headwords pointing at the wrong page

For each, the headword is cleaned and then searched across all 152 pages. If the clean
word exists, the headword and its page reference are corrected to the book. Anything
that cannot be found is reported and left untouched, because deleting learner content
is not this script's job.
"""
import json
import re
import sqlite3

DB = "/var/www/deutschly/code/prisma/dev.db"
PAGES = json.load(open("/home/houssam/pdf_pages.json", encoding="utf-8"))

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
UMAP = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}


def norm(s):
    if not s:
        return ""
    x = ARABIC.sub(" ", str(s))
    for k, v in UMAP.items():
        x = x.replace(k, v)
    x = x.lower()
    return re.sub(r"[^a-z0-9]+", "", x)


def clean_word(w):
    """strip OCR artefacts: a stray single letter prefix, parentheticals, articles"""
    t = (w or "").strip()
    t = re.sub(r"^\(.*?\)\s*", "", t)          # "(zu) dick" -> "dick"
    t = re.sub(r"^[a-zA-Z]\s+(?=\S)", "", t)   # "g Anschluss" -> "Anschluss"
    t = re.sub(r"^-\s*", "", t)
    t = t.strip(" .,;:")
    return t


def pages_with(needle):
    if not needle or len(needle) < 3:
        return []
    return [int(p) for p, txt in PAGES.items() if needle in txt]


db = sqlite3.connect(DB)
cur = db.cursor()
rows = cur.execute("""
    SELECT id, germanWord, baseForm, pdfPageRef, lessonId FROM VocabularyItem
""").fetchall()

fixed_word, fixed_page, unresolved = [], [], []

for vid, gw, base, page, lesson in rows:
    candidates = [c for c in {clean_word(gw), clean_word(base)} if c]
    if not candidates:
        unresolved.append((gw, base, page, "no usable word text"))
        continue

    page_text = PAGES.get(str(page)) or ""

    # already on the page it claims, but the stored headword may still carry an artefact
    if any(norm(c) and norm(c) in page_text for c in candidates):
        good = next(c for c in candidates if norm(c) and norm(c) in page_text)
        if good != gw or (base and clean_word(base) != base):
            cur.execute("UPDATE VocabularyItem SET germanWord = ?, baseForm = ? WHERE id = ?",
                        (good, clean_word(base) if base else good, vid))
            fixed_word.append((gw, good, page, page))
        continue

    # otherwise look for it anywhere in the book
    hits = sorted({p for c in candidates for p in pages_with(norm(c))},
                  key=lambda p: (abs(p - page), p))
    if not hits:
        unresolved.append((gw, base, page, "not found anywhere in the book"))
        continue

    best = hits[0]
    new_word = candidates[0]
    cur.execute("UPDATE VocabularyItem SET germanWord = ?, pdfPageRef = ? WHERE id = ?",
                (new_word, best, vid))
    if new_word != gw:
        fixed_word.append((gw, new_word, page, best))
    else:
        fixed_page.append((gw, page, best))

db.commit()

print("vocabulary rows           :", len(rows))
print("headwords cleaned         :", len(fixed_word))
print("page reference corrected  :", len(fixed_page))
print("unresolved, left untouched:", len(unresolved))
print("")
print("sample headword fixes:")
for old, new, p0, p1 in fixed_word[:10]:
    print(f"   {old!r} -> {new!r}   page {p0} -> {p1}")
print("")
print("sample page corrections:")
for w, p0, p1 in fixed_page[:10]:
    print(f"   {w!r}  page {p0} -> {p1}")
print("")
print("unresolved:")
for gw, base, page, why in unresolved[:25]:
    print(f"   {gw!r} (p{page}) {why}")
