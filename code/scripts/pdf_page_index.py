#!/usr/bin/env python3
"""Dump a normalised index of every PDF page so app content can be traced back to the book.

/home/houssam/pdf_pages.json  ->  { "1": "<normalised text>", ... "152": "..." }

Normalisation strips Arabic (which extracts reversed), lowercases, folds umlauts,
and removes punctuation and whitespace, so a database string can be tested for
presence in a page with a plain substring check.
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

ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]")
UMAP = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "Ä": "ae", "Ö": "oe", "Ü": "ue"}


def norm(s):
    s = ARABIC.sub(" ", s)
    for k, v in UMAP.items():
        s = s.replace(k, v)
    s = s.lower()
    s = re.sub(r"[\u064b-\u0652]", "", s)
    s = re.sub(r"[^a-z0-9]+", "", s)   # keep only alphanumerics
    return s


def main():
    pages = {}
    for p in range(1, 153):
        raw = subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), PDF, "-"],
                             capture_output=True, text=True).stdout
        pages[str(p)] = norm(raw)
    with open("/home/houssam/pdf_pages.json", "w", encoding="utf-8") as f:
        json.dump(pages, f)
    sizes = [len(v) for v in pages.values()]
    print("pages indexed:", len(pages))
    print("normalised chars, min/max:", min(sizes), max(sizes))
    print("empty pages:", sum(1 for s in sizes if s < 20))


if __name__ == "__main__":
    main()
