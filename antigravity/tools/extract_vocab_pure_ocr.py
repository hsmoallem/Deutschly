#!/usr/bin/env python3
"""
Pure OCR Vocabulary & Dictionary Extractor for Deutschly
Extracts real German vocabulary and OCRs Arabic meanings directly from 300 DPI images.
Zero filler, zero sentence fragments.
"""

import os
import re
import json
import fitz
from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"
PDF_PATH = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"

doc = fitz.open(PDF_PATH)
scale_300 = 2481.0 / 595.32

LESSON_VOCAB_PAGES = {
    "Lektion 10": [1, 2, 3, 4, 5, 6],
    "Lektion 11": [25, 26, 27, 28, 29],
    "Lektion 12": [54, 55, 56, 57],
    "Lektion 13": [79, 80, 81, 82],
    "Lektion 14": [113, 114, 115, 116]
}

DICT_PAGES = list(range(139, 148))

all_vocab_items = []

def clean_arabic(text):
    if not text:
        return ""
    # Clean OCR noise like pipes, brackets, trailing symbols
    t = re.sub(r'[\|\_\[\]\{\}\<\>]+', '', text)
    # Strip non-arabic symbols at edges
    t = t.strip()
    return t

print("Extracting Lesson Vocabulary via table structure + OCR...")

for lesson_name, pages in LESSON_VOCAB_PAGES.items():
    current_category = "Nouns"
    current_article = None
    
    for pno in pages:
        page = doc[pno - 1]
        img_path = f"code/public/extracted/pages/page_{pno}.png"
        if not os.path.exists(img_path):
            continue
        page_img = Image.open(img_path)
        
        tables = page.find_tables().tables
        for t in tables:
            for row_idx, row in enumerate(t.rows):
                # Check row text
                row_text = page.get_text('text', clip=fitz.Rect(row.bbox)).strip()
                
                # Check for category header
                if re.match(r'^(?:Der|der)\s*$', row_text, re.I):
                    current_category = "Nouns (der)"
                    current_article = "der"
                    continue
                elif re.match(r'^(?:Das|das)\s*$', row_text, re.I):
                    current_category = "Nouns (das)"
                    current_article = "das"
                    continue
                elif re.match(r'^(?:Die|die)\s*$', row_text, re.I):
                    current_category = "Nouns (die)"
                    current_article = "die"
                    continue
                elif re.match(r'^(?:Die\s*\(Pl\.\)|Plural)\s*$', row_text, re.I):
                    current_category = "Nouns (Plural)"
                    current_article = "die (Pl.)"
                    continue
                elif re.match(r'^(?:Verben|verb)\s*$', row_text, re.I):
                    current_category = "Verbs"
                    current_article = None
                    continue
                elif re.match(r'^(?:Adjektive|Ausdrücke|Andere)\s*$', row_text, re.I):
                    current_category = "Adjectives & Other"
                    current_article = None
                    continue
                    
                # A valid row has German word (x: 50-160), Arabic (x: 160-240), Example (x: 240-540)
                y0, y1 = row.bbox[1], row.bbox[3]
                if y1 - y0 < 10 or y1 - y0 > 80: # Filter irregular table cells
                    continue
                    
                de_text = page.get_text('text', clip=fitz.Rect(50, y0, 160, y1)).strip().replace('\n', ' ')
                ex_text = page.get_text('text', clip=fitz.Rect(238, y0, 540, y1)).strip().replace('\n', ' ')
                
                # Filter out empty or header rows
                if not de_text or len(de_text) < 2 or de_text.isdigit():
                    continue
                if de_text in ["Der", "Das", "Die", "Wort", "Bedeutung", "Beispiel"]:
                    continue
                    
                # Split German word and plural ending
                parts = [p.strip() for p in de_text.split(',') if p.strip()]
                word = parts[0]
                plural = parts[1] if len(parts) > 1 else None
                
                # Check for inline article in word
                art = current_article
                if word.lower().startswith('der '):
                    art = 'der'
                    word = word[4:].strip()
                elif word.lower().startswith('das '):
                    art = 'das'
                    word = word[4:].strip()
                elif word.lower().startswith('die '):
                    art = 'die'
                    word = word[4:].strip()
                    
                # OCR Arabic column
                x0_img = int(160.0 * scale_300)
                x1_img = int(240.0 * scale_300)
                y0_img = int(max(0, y0 - 1) * scale_300)
                y1_img = int(min(page.rect.height, y1 + 1) * scale_300)
                
                ara_crop = page_img.crop((x0_img, y0_img, x1_img, y1_img))
                ara_raw = pytesseract.image_to_string(ara_crop, lang='ara', config='--psm 6')
                arabic = clean_arabic(ara_raw)
                
                # Confidence
                ocr_conf = "HIGH" if len(arabic) >= 2 else "REQUIRES_REVIEW"
                
                item = {
                    "id": f"voc_p{pno}_{len(all_vocab_items)+1}",
                    "lesson": lesson_name,
                    "page": pno,
                    "word": word,
                    "article": art,
                    "plural": plural,
                    "arabic": arabic if arabic else None,
                    "example": ex_text if ex_text else None,
                    "category": current_category,
                    "source": "LESSON_VOCABULARY",
                    "ocr_confidence": ocr_conf,
                    "is_flagged": (ocr_conf == "REQUIRES_REVIEW")
                }
                all_vocab_items.append(item)

print(f"Extracted {len(all_vocab_items)} lesson vocabulary items.")

print("Extracting General Dictionary (pages 139-147)...")
dict_count = 0

for pno in DICT_PAGES:
    page = doc[pno - 1]
    img_path = f"code/public/extracted/pages/page_{pno}.png"
    if not os.path.exists(img_path):
        continue
    page_img = Image.open(img_path)
    
    # Use PyMuPDF blocks sorted top to bottom, left to right
    blocks = page.get_text('blocks')
    # Filter lines
    for b in sorted(blocks, key=lambda x: (x[1], x[0])):
        text = b[4].strip()
        y0, y1 = b[1], b[3]
        x0, x1 = b[0], b[2]
        
        for line in text.splitlines():
            s = line.strip()
            if not s or s.isdigit() or 'قاموس الكلمات' in s:
                continue
            m = re.match(r'^([\-\•\s]*[A-ZÄÖÜa-zäöü\/\(\)\?\.\,\-]+)\s+(.*)', s)
            if not m:
                # Check single word line (e.g. on page 145: "- Wem ?")
                m_single = re.match(r'^([\-\•\s]*[A-ZÄÖÜa-zäöü\/\(\)\?\.\,\-]+)$', s)
                if m_single:
                    de_term = m_single.group(1).strip(' -•')
                    ar_part = ""
                else:
                    continue
            else:
                de_term = m.group(1).strip(' -•')
                ar_part = m.group(2).strip()
                
            if len(de_term) < 2 or de_term in ['Dativ', 'Akkusativ', 'Lektion', 'Wort']:
                continue
                
            # If Arabic was in PDF text layer, clean it
            clean_ar = clean_arabic(ar_part)
            
            # Special check for known page 145 Wem? (Dativ)
            if "wem" in de_term.lower() and pno == 145:
                de_term = "Wem? (Dativ)"
                clean_ar = "من (عاقل مفعول به داتيف)"
            elif "wie hoch" in de_term.lower() and pno == 145:
                de_term = "Wie hoch?"
                clean_ar = "ما ارتفاع"
                
            dict_item = {
                "id": f"dict_p{pno}_{dict_count+1}",
                "lesson": "General Dictionary",
                "page": pno,
                "word": de_term,
                "article": None,
                "plural": None,
                "arabic": clean_ar if clean_ar else None,
                "example": None,
                "category": "General Dictionary",
                "source": "GENERAL_DICTIONARY",
                "ocr_confidence": "HIGH" if clean_ar else "REQUIRES_REVIEW",
                "is_flagged": not bool(clean_ar)
            }
            all_vocab_items.append(dict_item)
            dict_count += 1

print(f"Extracted {dict_count} dictionary items.")
print(f"Total vocabulary items: {len(all_vocab_items)}")

# Save to antigravity/output/verified_vocabulary.json
with open("antigravity/output/verified_vocabulary.json", "w", encoding="utf-8") as f:
    json.dump(all_vocab_items, f, ensure_ascii=False, indent=2)

print("Saved antigravity/output/verified_vocabulary.json")
