#!/usr/bin/env python3
"""Resolve each reading exercise in the app to the book's own text for that page.

Rule, per reading exercise page P:
  1. prefer a Texterfassung block whose questions begin on P, or on P+1 with the text
     starting on P, keeping the block closest to P
  2. otherwise take the German prose printed on P itself
  3. otherwise report no text, so the exercise can be reclassified instead of keeping
     a written passage

Output /home/houssam/passage_map.json:
    { "19": {"source": "block pp18-19", "text": "..."}, "76": {"source": "none", "text": null}, ... }
"""
import json
import re
import subprocess

PDF = "/home/houssam/deutschly-source/source_textbook.pdf"
READING_PAGES = [19, 21, 23, 47, 49, 51, 74, 76, 108, 111, 132, 135, 137]

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufb50-\ufdff\ufe70-\ufeff]")
LATIN = re.compile(r"[A-Za-z\u00c0-\u017f\u00df]")
NOISE = re.compile(r"^[\s.=_\-]{3,}$")
Q_LINE = re.compile(r"^\s*\d{1,3}\s*[.)\-\u2013]")
OPTION_LINE = re.compile(r"^\s*[a-dA-D]\s*[-)\u2013]")   # answer options start this way
OPT_TABLE = re.compile(r"(\b[a-dA-D]\s*[-\u2013)]\s*\S.*){2,}")  # a- x  b- y  on one line
TAIL = re.compile(r"(w\u00e4hle die richtige antwort|whle die richtige antwort|"
                  r"lies den folgenden text|lies bitte die texte)", re.I)
MARK = re.compile(r"texterfassung|lies den folgenden text|lies bitte die texte|lies den text", re.I)
QUESTS = re.compile(r"w\u00e4hle die richtige antwort", re.I)


def trim_tail(text):
    """cut a trailing fragment where a question instruction or the next text bled in"""
    m = TAIL.search(text)
    if m and m.start() > 60:
        text = text[: m.start()].rstrip(" -\u2013,")
    last = max(text.rfind("."), text.rfind("!"), text.rfind("?"))
    if last > 60 and len(text) - last < 140:
        text = text[: last + 1].strip()
    return text


def clean(lines):
    out = []
    for l in lines:
        x = ARABIC.sub(" ", l)
        x = re.sub(r"\s{2,}", " ", x).strip()
        if not x or NOISE.match(x):
            continue
        if Q_LINE.match(x) or QUESTS.search(x) or OPTION_LINE.match(x) or OPT_TABLE.search(x):
            continue
        out.append(x)
    text = re.sub(r"\s{2,}", " ", " ".join(out)).strip()
    return trim_tail(text)


def is_prose(line):
    letters = [c for c in line if c.isalpha()]
    if len(letters) < 20:
        return False
    return sum(1 for c in letters if LATIN.match(c)) / len(letters) > 0.8


def page_lines(p):
    return subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), PDF, "-"],
                          capture_output=True, text=True).stdout.splitlines()


with open("/home/houssam/book_passages.json", encoding="utf-8") as f:
    blocks = json.load(f)

result = {}
for target in READING_PAGES:
    # prefer a block whose questions begin on this page, taking the main (longest) text,
    # then a block whose text starts here
    cands = [b for b in blocks if b["questionsPage"] == target]
    if not cands:
        cands = [b for b in blocks if b["startPage"] == target]
    if cands:
        best = sorted(cands, key=lambda b: -b["chars"])[0]
        result[str(target)] = {"source": f"block pp{best['startPage']}-{best['questionsPage']}",
                               "text": trim_tail(best["text"])}
        continue

    # fall back to the prose printed on the page itself
    lines = page_lines(target)
    prose = [l for l in lines if is_prose(l)]
    text = clean(prose)
    if len(text) >= 250:
        result[str(target)] = {"source": f"prose on p{target}", "text": text}
    else:
        result[str(target)] = {"source": "none", "text": None}

with open("/home/houssam/passage_map.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

for p in READING_PAGES:
    e = result[str(p)]
    t = e["text"]
    print(f"  p{p:<4} {e['source']:<18} " + (f"{len(t):5d} chars  \"{t[:80]}\"" if t else "NO TEXT IN THE BOOK"))
