import fitz
from fontTools.ttLib import TTFont
import io

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

res = doc.extract_font(158)
name, ext, ftype, buffer = res
ttf = TTFont(io.BytesIO(buffer))
cmap = ttf.getBestCmap()
print(f"Font 158 cmap ({len(cmap)} entries):")
for k, v in sorted(cmap.items())[:50]:
    print(f"  0x{k:04X} -> {v}")
