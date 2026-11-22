import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

page = doc[7] # page 8
blocks = page.get_text("blocks")
print(f"Page 8 blocks count: {len(blocks)}")
for b in blocks[:10]:
    x0, y0, x1, y1, text, block_no, btype = b
    first_line = text.strip().split("\n")[0]
    print(f"Block {block_no} ({x0:.1f}, {y0:.1f}, {x1:.1f}, {y1:.1f}): {first_line[:80]}")
