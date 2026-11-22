import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

for pno in range(110, 152):
    text = doc[pno].get_text()
    lines = [l.strip() for l in text.split("\n") if l.strip()][:6]
    print(f"P.{pno+1}: {' /// '.join(lines[:3])}")
