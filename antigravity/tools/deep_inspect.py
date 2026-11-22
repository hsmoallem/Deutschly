import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

def inspect_lektion(start_p, end_p, name):
    print(f"\n==========================================")
    print(f"ANALYSIS OF {name} (Pages {start_p} to {end_p})")
    print(f"==========================================")
    
    total_pages = end_p - start_p + 1
    sections = []
    
    for p in range(start_p - 1, end_p):
        text = doc[p].get_text()
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Look for headers
        q_count = len(re.findall(r'^\s*\d+[\.\-\)]', text, re.MULTILINE))
        
        print(f"Page {p+1} ({len(lines)} lines, ~{q_count} numbered items):")
        if lines:
            print("  Top lines:", " | ".join(lines[:3])[:100])
            
            # Check for exercise patterns like "a-", "b-", "A)", "B)"
            mc_choices = len(re.findall(r'[a-d][\.\-\)]', text, re.I))
            if mc_choices > 0:
                print(f"  Multiple choice choices detected: ~{mc_choices}")

inspect_lektion(1, 24, "Lektion 10")
inspect_lektion(25, 53, "Lektion 11")
inspect_lektion(54, 78, "Lektion 12")
inspect_lektion(79, 112, "Lektion 13")
inspect_lektion(113, 138, "Lektion 14")
inspect_lektion(139, 152, "Dictionary & Appendices")
