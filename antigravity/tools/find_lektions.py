import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

for pno in range(50, 110):
    text = doc[pno].get_text()
    first_lines = [l.strip() for l in text.split("\n") if l.strip()][:5]
    for line in first_lines:
        if "lektion" in line.lower() or "der kunde" in line.lower() or "kleidung" in line.lower() or "unterwegs" in line.lower() or "gesundheit" in line.lower():
            print(f"P.{pno+1}: {line}")
