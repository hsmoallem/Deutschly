#!/usr/bin/env python3
"""Repair Arabic meanings that were truncated to a fragment.

The seeded data contains meanings cut down to one or two characters, for example
"بة" where Empfehlung should be "توصية", or "?" where Wo should be "أين". Each entry
below is keyed by the German word and the exact broken value, so a row that has
already been corrected is never touched twice.

Legitimately short Arabic words are deliberately left alone: أخ for Bruder, فم for
Mund, يد for Hand, مع for mit, و for und, ثم for dann, حر for frei, حظ for Glück.
"""
import sqlite3

DB = "/var/www/deutschly/code/prisma/dev.db"

FIXES = [
    ("Anmeldung", "و", "تسجيل"),
    ("Empfehlung", "بة", "توصية"),
    ("Entspannung", "اا", "استرخاء"),
    ("einladen", "زم", "يدعو"),
    ("einladen", "zu", "يدعو"),
    ("Termin - machen", "عد", "موعد"),
    ("verschieben", "عد", "يؤجل"),
    ("anbei", "رق", "مرفق"),
    ("bevor", "بل", "قبل"),
    ("dann", "مم", "ثم"),
    ("gegen", "سد", "ضد"),
    ("lustig", "رح", "مضحك"),
    ("nach", "كل", "بعد"),
    ("nur", "قط", "فقط"),
    ("schlimm", "يئ", "سيئ"),
    ("vor", "ل", "قبل"),
    ("zurzeit", "أن", "حاليا"),
    ("Weg", "(", "طريق"),
    ("Ankunft", "مع", "وصول"),
    ("Bäckerei", "ا", "مخبز"),
    ("Garage", "ا", "جراج"),
    ("Briefmarke", "أ", "طابع بريد"),
    ("Führung", "ل", "جولة"),
    ("Gruppe", "ا", "مجموعة"),
    ("pp Hausaufgabe", "ى", "واجب منزلي"),
    ("Hausaufgabe", "ى", "واجب منزلي"),
    ("Idee", "ل", "فكرة"),
    ("Information", "أ", "معلومة"),
    ("Kreuzung", "ل", "تقاطع"),
    ("Lage", "ل", "موقع"),
    ("Luxus", "يه", "رفاهية"),
    ("Marke", "١", "ماركة"),
    ("Minute", "ل", "دقيقة"),
    ("Prüfung", "ل", "امتحان"),
    ("Rechnung", "ل", "فاتورة"),
    ("Sehenswürdigkeit", "ي", "معلم سياحي"),
    ("Sekretärin", "ل", "سكرتيرة"),
    ("Telefonnummer", "ا", "رقم هاتف"),
    ("Tür", "ال", "باب"),
    ("Viertelstunde", "لل", "ربع ساعة"),
    ("Zahl", "ل", "رقم"),
    ("Zigarette", "ل", "سيجارة"),
    ("Bratwurst", "ا", "سجق مشوي"),
    ("Jeans (Pl)", "يل", "بنطلون جينز"),
    ("Techniker", "نى", "فني"),
    ("Frühstück", "ا", "إفطار"),
    ("beschreiben", "يص", "يصف"),
    ("Wo", "?", "أين"),
    ("Wann", "?", "متى"),
    ("Woher", "?", "من أين"),
    ("Welch", "?", "أي"),
    ("Wen", "?", "من"),
    ("Absage", "رض", "إلغاء"),
]

db = sqlite3.connect(DB)
cur = db.cursor()

fixed = 0
for word, old, new in FIXES:
    rows = cur.execute(
        "SELECT id FROM VocabularyItem WHERE germanWord = ? AND meaningAr = ?", (word, old)
    ).fetchall()
    for (vid,) in rows:
        cur.execute("UPDATE VocabularyItem SET meaningAr = ? WHERE id = ?", (new, vid))
        fixed += 1
    if rows:
        print(f"  {word:<24} {old!r:<8} -> {new}   ({len(rows)} row{'s' if len(rows) > 1 else ''})")

db.commit()

# what is left
rows = cur.execute("SELECT germanWord, meaningAr FROM VocabularyItem").fetchall()
short = [(w, a) for w, a in rows if a and len(a) <= 2]
print("")
print("rows updated:", fixed)
print("meanings still 1 or 2 characters:", len(short), "(expected to be the genuinely short words)")
print("  ", ", ".join(f"{w}={a}" for w, a in short))
