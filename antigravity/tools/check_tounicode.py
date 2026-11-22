import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Let's inspect xrefs for fonts on page 1
for f in doc[0].get_fonts():
    xref = f[0]
    font_name = f[3]
    try:
        font_data = doc.xref_object(xref)
        print(f"--- Font {xref}: {font_name} ---")
        if "/ToUnicode" in font_data:
            to_uni_xref = int(font_data.split("/ToUnicode")[1].split()[0])
            stream = doc.xref_stream(to_uni_xref).decode('latin1', errors='ignore')
            print(f"ToUnicode stream preview (len={len(stream)}):")
            print(stream[:400])
    except Exception as e:
        print(f"Error inspecting {xref}: {e}")
