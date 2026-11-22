import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)
page = doc[0]

# Let's see raw bytes in the page content stream
for xref in page.get_contents():
    stream = doc.xref_stream(xref)
    # search for Tj or TJ operators with Arabic or German
    lines = stream.split(b'\n')
    for line in lines:
        if b'Tj' in line or b'TJ' in line:
            if b'Lektion' in line or b'Absender' in line or b'Anruf' in line or b'Arzt' in line or b'Arm' in line:
                print(line)
