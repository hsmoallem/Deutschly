import sqlite3, re

conn = sqlite3.connect('code/prisma/dev.db')
c = conn.cursor()
c.execute('SELECT germanWord, meaningAr, pdfPageRef FROM VocabularyItem')
rows = c.fetchall()

def is_clean_arabic(s):
    if not s or not s.strip():
        return False
    # Check if corrupted / noisy
    if re.search(r'[0-9]{2,}', s):
        return False
    if re.search(r'[#\$\%\|\_\{\}\<\>\\~`@\^\*]', s):
        return False
    if any(ord(ch) >= 0xFB50 for ch in s):
        return False
    if re.search(r'[ػفچ̂ؾٍِ٘ٓٛ]', s):
        return False
    # Check if contains Arabic characters
    ar_chars = len(re.findall(r'[\u0600-\u06FF]', s))
    if ar_chars < 2:
        return False
    return True

clean_count = 0
dirty_count = 0
dirty_words = {}

for w, ar, p in rows:
    if is_clean_arabic(ar):
        clean_count += 1
    else:
        dirty_count += 1
        dirty_words[w] = (ar, p)

print(f'Clean: {clean_count}, Dirty/Empty: {dirty_count}')
print(f'Unique dirty words: {len(dirty_words)}')

import json
with open('antigravity/tools/dirty_words.json', 'w', encoding='utf-8') as f:
    json.dump(dirty_words, f, ensure_ascii=False, indent=2)
