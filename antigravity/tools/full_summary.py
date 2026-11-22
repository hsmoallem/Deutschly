import fitz
import re
import json

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

results = {
    "total_pages": len(doc),
    "lektions": {},
    "page_details": []
}

current_lektion = "Intro"

for pno in range(len(doc)):
    page = doc[pno]
    text = page.get_text()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # Detect lektion
    m = re.search(r'Lektion\s*\(?(\d+)\)?', text, re.I)
    if m:
        num = int(m.group(1))
        current_lektion = f"Lektion {num}"
    elif pno >= 138: # page 139+
        if pno <= 146:
            current_lektion = "قاموس الكلمات (Dictionary & Appendix)"
        else:
            current_lektion = "أوراق الملاحظات (Student Notes Pages)"
            
    if current_lektion not in results["lektions"]:
        results["lektions"][current_lektion] = {
            "start_page": pno + 1,
            "end_page": pno + 1,
            "pages": [],
            "grammar_sections": [],
            "exercises": [],
            "vocabulary_count": 0,
            "questions_count": 0,
            "choices_count": 0
        }
    
    results["lektions"][current_lektion]["end_page"] = pno + 1
    results["lektions"][current_lektion]["pages"].append(pno + 1)
    
    # Check for question numbers like "1-", "1.", "1 )"
    q_matches = re.findall(r'(?:^|\n)\s*(\d+)[\.\-\)]\s*([^\n]+)', text)
    # Check for choices
    c_matches = re.findall(r'\b([a-dA-D])[\.\-\)]\s*([^\n]+)', text)
    
    # Check for grammar keywords
    for l in lines:
        if any(k in l.lower() for k in ["grammatik", "regel", "das präsens", "das perfekt", "modalverben", "possessiv", "präposition", "personalpronomen", "imperativ", "konjunktiv", "welch", "dies", "komparativ", "superlativ", "verben mit", "nebensätze", "relativsätze", "das futur"]):
            if len(l) < 80:
                results["lektions"][current_lektion]["grammar_sections"].append(f"P.{pno+1}: {l}")

    # Check for exercise headers
    for l in lines:
        if any(k in l.lower() for k in ["wähle die richtige", "prüfen", "prüfung", "test", "übung", "ergänze", "lies den text", "lies bitte"]):
            if len(l) < 80:
                results["lektions"][current_lektion]["exercises"].append(f"P.{pno+1}: {l}")

    results["lektions"][current_lektion]["questions_count"] += len(q_matches)
    results["lektions"][current_lektion]["choices_count"] += len(c_matches)

print("SUMMARY OF LEKTIONS:")
total_q = 0
for lek, data in results["lektions"].items():
    print(f"\n{lek}: Pages {data['start_page']} - {data['end_page']} ({len(data['pages'])} pages)")
    print(f"  Grammar headers: {len(data['grammar_sections'])}")
    for g in data['grammar_sections'][:5]:
        print(f"    - {g}")
    print(f"  Exercise headers: {len(data['exercises'])}")
    for ex in data['exercises'][:5]:
        print(f"    - {ex}")
    print(f"  Questions identified: ~{data['questions_count']}")
    print(f"  Choices identified: ~{data['choices_count']}")
    total_q += data['questions_count']

print(f"\nTOTAL QUESTIONS ACROSS BOOK: ~{total_q}")
