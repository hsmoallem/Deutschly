import fitz
from fontTools.ttLib import TTFont
import io

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

for f in doc[0].get_fonts():
    xref = f[0]
    font_name = f[3]
    try:
        res = doc.extract_font(xref)
        # res is tuple: (name, ext, type, buffer)
        name, ext, ftype, buffer = res
        if buffer:
            ttf = TTFont(io.BytesIO(buffer))
            print(f"Xref {xref} ({name}): ext={ext}, glyphs={len(ttf.getGlyphOrder())}")
            best_cmap = ttf.getBestCmap()
            print(f"  Best cmap entries: {len(best_cmap) if best_cmap else 0}")
            glyph_names = [g for g in ttf.getGlyphOrder() if not g.startswith("glyph") and not g.startswith(".")]
            print("  Named glyphs preview:", glyph_names[:30])
    except Exception as e:
        print(f"Error on font {xref}: {e}")
