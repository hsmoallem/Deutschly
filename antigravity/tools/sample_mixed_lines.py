import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Let's collect sample pairs of German vocab -> extracted Arabic text
pairs = []
for pno in range(6):
    text = doc[pno].get_text()
    for line in text.split("\n"):
        line = line.strip()
        # Look for line with Arabic chars
        arabic_chars = [c for c in line if '\u0600' <= c <= '\u06ff']
        latin_chars = [c for c in line if 'a' <= c.lower() <= 'z']
        if arabic_chars and latin_chars:
            pairs.append(line)

print(f"Found {len(pairs)} lines with mixed Latin & Arabic in pages 1-6:")
for p in pairs[:20]:
    print(" ", p)
