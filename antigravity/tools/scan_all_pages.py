import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

print("Page Scan:")
for pno in range(len(doc)):
    text = doc[pno].get_text()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    first_few = " | ".join(lines[:4]) if lines else "EMPTY"
    
    # Check for Lektion or main titles
    lektions = re.findall(r'Lektion\s*\d+', text, re.I)
    if lektions or pno in [0, 24, 53, 104, 130, 140, 145, 150, 151]:
        print(f"P.{pno+1}: [{', '.join(set(lektions)) if lektions else 'No Lektion mark'}] -> {first_few[:120]}")
