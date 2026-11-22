import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)
page = doc[0]

contents = page.get_contents()
print(f"Contents xrefs: {contents}")
for xref in contents:
    stream = doc.xref_stream(xref)
    print(f"Xref {xref} decompressed len: {len(stream)}")
    # Print some text occurrences
    idx = 0
    while True:
        idx = stream.find(b'Tj', idx)
        if idx == -1:
            break
        snippet = stream[max(0, idx-50):min(len(stream), idx+30)]
        print(f"Snippet near Tj: {snippet!r}")
        idx += 2
        if idx > 1500:
            break
