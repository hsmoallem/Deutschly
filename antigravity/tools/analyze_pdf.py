import fitz  # PyMuPDF
import json
import sys

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"

doc = fitz.open(pdf_path)
print(f"Total pages: {len(doc)}")
print(f"Metadata: {doc.metadata}")

# Check outline / table of contents
toc = doc.get_toc()
print(f"TOC entries: {len(toc)}")
for item in toc[:20]:
    print(item)

# Inspect first 10 pages and sample text
empty_pages = []
page_char_counts = []

for page_num in range(len(doc)):
    page = doc[page_num]
    text = page.get_text()
    page_char_counts.append((page_num + 1, len(text.strip())))
    if len(text.strip()) == 0:
        empty_pages.append(page_num + 1)

print(f"Pages with 0 text characters (possible scans): {empty_pages}")
print(f"Average characters per page: {sum(c[1] for c in page_char_counts)/len(page_char_counts):.1f}")
print("First 10 pages char counts:", page_char_counts[:10])
print("Last 10 pages char counts:", page_char_counts[-10:])
