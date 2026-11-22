import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

for pno in [0, 1, 2, 3, 4, 5, 10, 20, 50, 100, 140, 150, 151]:
    if pno < len(doc):
        text = doc[pno].get_text()
        print(f"=== PAGE {pno + 1} ===")
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:30]:
            print(line)
        print("...\n")
