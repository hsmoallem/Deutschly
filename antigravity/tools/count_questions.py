import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

total_exercises = 0
total_questions = 0
questions_by_lektion = {
    "Lektion 10": {"ex": 0, "q": 0, "pages": "1-24"},
    "Lektion 11": {"ex": 0, "q": 0, "pages": "25-53"},
    "Lektion 12": {"ex": 0, "q": 0, "pages": "54-78"},
    "Lektion 13": {"ex": 0, "q": 0, "pages": "79-112"},
    "Lektion 14": {"ex": 0, "q": 0, "pages": "113-138"},
}

def get_lektion_name(pno):
    if pno <= 24: return "Lektion 10"
    if pno <= 53: return "Lektion 11"
    if pno <= 78: return "Lektion 12"
    if pno <= 112: return "Lektion 13"
    if pno <= 138: return "Lektion 14"
    return "Other"

for pno in range(1, 139):
    text = doc[pno-1].get_text()
    lek = get_lektion_name(pno)
    
    # Exercise headers
    ex_headers = re.findall(r'(?:^|\n)\s*(?:Wähle die richtige Antwort aus|Prüfung|Test|Allgemeine Übungen|Übungen|Lies den folgenden Text|Lies bitte den Text)', text, re.I)
    questions_by_lektion[lek]["ex"] += len(ex_headers)
    
    # Numbered questions: 1-, 2-, 1., 2., 1 ), 2 )
    # Be careful not to count numbers inside sentences
    lines = text.split("\n")
    for line in lines:
        line_s = line.strip()
        if re.match(r'^\d+[\.\-\)]\s+[A-Za-zÄÖÜäöüß]', line_s) or re.match(r'^[A-Z]\)\s+[A-Za-zÄÖÜäöüß]', line_s):
            questions_by_lektion[lek]["q"] += 1

print("EXACT EXERCISE & QUESTION BREAKDOWN:")
total_ex = 0
total_q = 0
for lek, d in questions_by_lektion.items():
    print(f"{lek} (Pages {d['pages']}): {d['ex']} exercise sections, {d['q']} interactive questions")
    total_ex += d['ex']
    total_q += d['q']

print(f"\nTOTALS: {total_ex} Exercise sections, {total_q} interactive questions")
