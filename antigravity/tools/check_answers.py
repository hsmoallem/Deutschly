import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Check for keywords like "Antworten", "Lösungen", "Schlüssel", "إجابات", "حلول"
for pno in range(len(doc)):
    text = doc[pno].get_text()
    for word in ["Lösung", "loesung", "Antworten", "Schlüssel", "إجابات", "الاجابات", "حلول", "نموذج"]:
        if word in text:
            print(f"P.{pno+1}: contains keyword '{word}'")

# Check styling on an exercise page (e.g., page 9 or 10 or 11)
page = doc[8] # page 9
blocks = page.get_text("dict")["blocks"]
print("\nSample spans from Page 9:")
span_count = 0
for b in blocks:
    if "lines" in b:
        for line in b["lines"]:
            for span in line["spans"]:
                if span["text"].strip():
                    span_count += 1
                    if span_count <= 25:
                        print(f"Text: {span['text'][:30]!r:32} | Font: {span['font']} | Size: {span['size']:.1f} | Flags: {span['flags']} | Color: {span['color']}")
