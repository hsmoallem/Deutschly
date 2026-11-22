import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Let's inspect pages 7 to 13 of Lektion 10 to see exact format of questions and choices
for pno in range(6, 14):
    text = doc[pno].get_text()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    print(f"\n--- PAGE {pno+1} ---")
    for l in lines[:15]:
        print("  ", l)
