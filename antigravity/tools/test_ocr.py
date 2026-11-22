import fitz
import pytesseract
from PIL import Image
import io

pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

# Let's take page 1, render it at 300 DPI (high resolution)
page = doc[0]
pix = page.get_pixmap(dpi=300)
img = Image.open(io.BytesIO(pix.tobytes("png")))

# Crop the top header of page 1 where the Arabic title was scrambled in text layer
# Bounding box roughly top 20%
width, height = img.size
crop_img = img.crop((0, 0, width, int(height * 0.25)))
crop_img.save("antigravity/tools/ocr_test_header.png")

# Run OCR with Arabic
text_ara = pytesseract.image_to_string(crop_img, lang="ara+deu")
print("OCR output on Page 1 Header:")
print(text_ara)
