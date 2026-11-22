import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

page = doc[0] # page 1
print("Page 1 raw text:")
print(page.get_text()[:600])

# Check font info on page 1
print("\nFonts on page 1:")
for f in page.get_fonts():
    print(f)
