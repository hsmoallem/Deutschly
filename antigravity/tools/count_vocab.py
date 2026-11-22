import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

def count_vocab_in_pages(pages):
    entries = []
    for p in pages:
        text = doc[p-1].get_text()
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for l in lines:
            # Check lines that look like vocabulary entries: German word followed by Arabic or example
            # In pages 1-6, 25-29, etc.
            if any(l.startswith(art) for art in ["Der ", "Das ", "Die ", "der ", "das ", "die "]):
                entries.append(l)
            elif re.match(r'^[A-ZÄÖÜ][a-zäöüß]+(?:,\s*[\.\-a-z0-9]+)?\s+', l):
                entries.append(l)
    return len(entries), entries

v10_count, _ = count_vocab_in_pages(range(1, 7))
v11_count, _ = count_vocab_in_pages(range(25, 30))
v12_count, _ = count_vocab_in_pages(range(54, 58))
v13_count, _ = count_vocab_in_pages(range(79, 83))
v14_count, _ = count_vocab_in_pages(range(113, 117))

# Dictionary pages 139 to 147
dict_lines = []
for p in range(139, 148):
    text = doc[p-1].get_text()
    for l in text.split("\n"):
        l = l.strip()
        if l and not l.isdigit() and "قاموس" not in l and len(l) > 2:
            dict_lines.append(l)

print(f"Lektion 10 Vocab items: ~{v10_count}")
print(f"Lektion 11 Vocab items: ~{v11_count}")
print(f"Lektion 12 Vocab items: ~{v12_count}")
print(f"Lektion 13 Vocab items: ~{v13_count}")
print(f"Lektion 14 Vocab items: ~{v14_count}")
print(f"Dictionary (Pages 139-147) entries: ~{len(dict_lines)}")
print(f"Total estimated vocabulary entries: ~{v10_count + v11_count + v12_count + v13_count + v14_count + len(dict_lines)}")
