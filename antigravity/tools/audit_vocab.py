import sqlite3, re
conn = sqlite3.connect('code/prisma/dev.db')
c = conn.cursor()
c.execute('SELECT germanWord, meaningAr, pdfPageRef FROM VocabularyItem')
rows = c.fetchall()

suspicious = []
for w, ar, p in rows:
    if not ar or not ar.strip():
        suspicious.append((w, ar, p, 'empty'))
        continue
    if re.search(r'[0-9]{2,}', ar):
        suspicious.append((w, ar, p, 'digits'))
    elif re.search(r'[#\$\%\|\_\{\}\<\>\\~`@\^\*]', ar):
        suspicious.append((w, ar, p, 'symbols'))
    elif any(ord(ch) >= 0xFB50 for ch in ar):
        suspicious.append((w, ar, p, 'presentation forms'))
    elif re.search(r'[ػچ̂ؾ٘ٓٛ]', ar):
        suspicious.append((w, ar, p, 'corrupted chars'))

print('Suspicious count:', len(suspicious))
for item in suspicious[:30]:
    print(item)
