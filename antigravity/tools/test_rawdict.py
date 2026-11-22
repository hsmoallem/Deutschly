import fitz
from fontTools.ttLib import TTFont
import io

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

res = doc.extract_font(158)
ttf = TTFont(io.BytesIO(res[3]))
cmap = ttf.getBestCmap()
# Reverse cmap: glyph_name -> unicode
rev_cmap = {v: chr(k) for k, v in cmap.items()}
glyph_order = ttf.getGlyphOrder()

print(f"Total glyphs in font 158: {len(glyph_order)}")

# Look at page 1 text using PyMuPDF "rawdict"
page = doc[0]
raw = page.get_text("rawdict")
for b in raw["blocks"]:
    if "lines" in b:
        for l in b["lines"]:
            decoded_line = []
            has_arabic = False
            for s in l["spans"]:
                if s["font"] == "Times New Roman,Bold":
                    chars = []
                    for c in s["chars"]:
                        cid = c.get("c") # character or cid
                        # In rawdict, c has 'origin', 'bbox', 'c'
                        chars.append(cid)
                    decoded_line.append("".join(chars))
            # print sample
            text_str = " ".join(decoded_line).strip()
            if text_str and any(ord(ch) > 128 for ch in text_str):
                print(f"Rawdict span text: {text_str!r}")
