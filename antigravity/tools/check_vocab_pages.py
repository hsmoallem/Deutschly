import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

print("--- PAGE 139 ---")
print(doc[138].get_text()[:400])

print("--- PAGE 140 ---")
print(doc[139].get_text()[:400])

print("--- PAGE 147 ---")
print(doc[146].get_text()[:400])
