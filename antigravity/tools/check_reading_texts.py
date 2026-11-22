import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

print("Reading Texts (Leseverstehen) & Dialogues:")
for pno in range(len(doc)):
    text = doc[pno].get_text()
    if any(h in text for h in ["Lies den folgenden Text", "Lies bitte den Text", "Alltagssituationen", "Situationen", "Wichtige Ausdrücke"]):
        first_few = [l.strip() for l in text.split("\n") if l.strip()][:3]
        print(f"Page {pno+1}: {' | '.join(first_few)}")
