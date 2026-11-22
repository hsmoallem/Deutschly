import fitz
import re
import json

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Let's inspect how choices are laid out on Page 9:
page = doc[8] # page 9
text = page.get_text()
lines = text.split("\n")
print("Page 9 raw lines:")
for idx, l in enumerate(lines[:35]):
    print(f"{idx:2d}: {l!r}")
