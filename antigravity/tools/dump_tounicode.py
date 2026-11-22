import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

for f in doc[0].get_fonts():
    xref = f[0]
    font_name = f[3]
    font_data = doc.xref_object(xref)
    if "/ToUnicode" in font_data:
        to_uni_xref = int(font_data.split("/ToUnicode")[1].split()[0])
        stream = doc.xref_stream(to_uni_xref).decode('latin1', errors='ignore')
        print(f"Font {xref} ({font_name}) ToUnicode ({len(stream)} bytes):")
        print(stream)
