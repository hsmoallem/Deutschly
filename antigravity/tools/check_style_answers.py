import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

different_styles_found = 0

for pno in range(10): # check first 10 pages
    page = doc[pno]
    blocks = page.get_text("dict")["blocks"]
    choices_styles = []
    for b in blocks:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    t = s["text"].strip()
                    if t.startswith(("a-", "b-", "c-", "d-", "a)", "b)", "c)", "d)", "A)", "B)", "C)", "D)")):
                        choices_styles.append((t[:15], s["font"], s["size"], s["flags"], s["color"]))
    
    # Check if within an exercise, one choice has a different color or bold
    colors = set(c[4] for c in choices_styles)
    flags = set(c[3] for c in choices_styles)
    if len(colors) > 1 or len(flags) > 1:
        print(f"Page {pno+1}: variety in choice styles -> colors={colors}, flags={flags}")
        different_styles_found += 1

print(f"Total pages with styled differences in choices: {different_styles_found}")
