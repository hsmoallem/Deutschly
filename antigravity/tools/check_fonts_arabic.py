import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

page = doc[0]
for b in page.get_text("dict")["blocks"]:
    if "lines" in b:
        for l in b["lines"]:
            for s in l["spans"]:
                if any(ord(c) > 128 for c in s["text"]):
                    print(f"Font: {s['font']:25} | Size: {s['size']:4.1f} | Text: {s['text']!r}")
