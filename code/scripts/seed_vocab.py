import fitz
import re
import sqlite3
import os

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

db_path = "prisma/dev.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get lesson mapping
cursor.execute("SELECT id, lessonNumber FROM Lesson")
lessons = {row[1]: row[0] for row in cursor.fetchall()}

vocab_inserted = 0

# 1. Lesson vocabulary pages: 1-6 (Lektion 10), 25-29 (Lektion 11), 54-57 (Lektion 12), 79-82 (Lektion 13), 113-116 (Lektion 14)
lesson_pages = [
    ("Lektion 10", range(1, 7)),
    ("Lektion 11", range(25, 30)),
    ("Lektion 12", range(54, 58)),
    ("Lektion 13", range(79, 83)),
    ("Lektion 14", range(113, 117)),
]

for lek_name, pages in lesson_pages:
    lek_id = lessons.get(lek_name)
    current_article = None
    
    for p in pages:
        text = doc[p-1].get_text()
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        for l in lines:
            if l in ["Der", "Das", "Die", "der", "das", "die"]:
                current_article = l.lower()
                continue
                
            # Pattern: German word, plural | meaning | example
            # e.g. "Arm, e مهاع Mein Arm tut weh"
            # or "Arzt, .. e ٛج١ت Du sollst zum Arzt gehen"
            m = re.match(r'^([A-ZÄÖÜa-zäöüß\- ]+?)(?:,\s*([\.\-a-z0-9]+))?\s+(.*?)(?:(?=[A-Z][a-zäöüß]+\s+[a-zäöüß]+)|$)', l)
            if m:
                word = m.group(1).strip()
                plural = m.group(2).strip() if m.group(2) else None
                rest = m.group(3).strip() if m.group(3) else ""
                
                # Check if rest contains example sentence
                ex_match = re.search(r'([A-ZÄÖÜ][a-zäöüß\s,]+\b(?:ist|hat|soll|tut|muss|kann|geht|fährt|war|haben|sind)\b[^.!?]*[.!?])', l)
                example = ex_match.group(1) if ex_match else None
                
                if len(word) > 1 and not word.isdigit() and "lektion" not in word.lower():
                    cursor.execute("""
                        INSERT INTO VocabularyItem (id, lessonId, germanWord, baseForm, article, pluralForm, meaningAr, meaningEn, wordType, exampleSentence, pdfPageRef)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        f"vocab_{p}_{vocab_inserted+1}",
                        lek_id,
                        word,
                        word,
                        current_article,
                        plural,
                        "انظر شرح الدرس في الكتاب",
                        "Vocabulary item from textbook",
                        "noun" if current_article else "word",
                        example,
                        p
                    ))
                    vocab_inserted += 1

# 2. General Dictionary (pages 139 to 147)
dict_lek_id = lessons.get("قاموس الكلمات")
for p in range(139, 148):
    text = doc[p-1].get_text()
    for line in text.split("\n"):
        line = line.strip()
        if not line or line.isdigit() or "قاموس" in line or len(line) < 3:
            continue
            
        # Match German word followed by Arabic translation
        # e.g. "Pullover بلوفر" or "Job وظ ٌفة"
        m = re.match(r'^([A-ZÄÖÜa-zäöüß\s\/\-\(\)]+?)\s+([\u0600-\u06FF\s\/]+)$', line)
        if m:
            de_word = m.group(1).strip()
            ar_word = m.group(2).strip()
            
            cursor.execute("""
                INSERT INTO VocabularyItem (id, lessonId, germanWord, baseForm, article, pluralForm, meaningAr, meaningEn, wordType, exampleSentence, pdfPageRef)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"dict_{p}_{vocab_inserted+1}",
                dict_lek_id,
                de_word,
                de_word,
                None,
                None,
                ar_word,
                de_word,
                "noun" if de_word[0].isupper() else "word",
                None,
                p
            ))
            vocab_inserted += 1

conn.commit()
conn.close()
print(f"Successfully seeded {vocab_inserted} vocabulary items into VocabularyItem table!")
