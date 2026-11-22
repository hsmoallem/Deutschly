import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

print(f"Total pages: {len(doc)}")

lektion_pages = []
for pno in range(len(doc)):
    text = doc[pno].get_text()
    matches = re.findall(r'(Lektion\s+\d+|LEKTION\s+\d+|Wiederholung|Grammatik|Übung|Übungen|Test|Prüfung)', text, re.IGNORECASE)
    if matches:
        lektion_pages.append((pno + 1, set(matches)))

for p, m in lektion_pages:
    print(f"Page {p}: {list(m)}")
