import fitz

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

page = doc[8] # page 9
# search for text of question 1
rects = page.search_for("1-Ich brauche einen Termin")
choice_rects = page.search_for("d - Könnt")
if rects and choice_rects:
    r_start = rects[0]
    r_end = choice_rects[0]
    # construct bbox covering the entire question
    bbox = fitz.Rect(30, r_start.y0 - 5, page.rect.width - 30, r_end.y1 + 5)
    pix = page.get_pixmap(clip=bbox, dpi=200)
    out_img = "antigravity/tools/sample_q1_p9.png"
    pix.save(out_img)
    print(f"Saved cropped question image {out_img}, size: {pix.width}x{pix.height}")
