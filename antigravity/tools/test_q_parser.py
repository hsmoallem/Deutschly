import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

def parse_page_questions(pno):
    page = doc[pno]
    text = page.get_text()
    
    # We want to identify question blocks and choices
    lines = text.split("\n")
    
    questions = []
    curr_q = None
    
    q_pattern = re.compile(r'^\s*(\d+)[\.\-\)]\s*(.+)')
    choice_pattern = re.compile(r'\b([a-dA-D])[\.\-\)]\s*([^a-dA-D\.\-\)]+)')
    
    for l in lines:
        l_str = l.strip()
        if not l_str:
            continue
            
        m_q = q_pattern.match(l_str)
        if m_q and not any(l_str.startswith(c) for c in ["a-", "b-", "c-", "d-", "a)", "b)", "c)", "d)"]):
            # Check if this looks like a genuine question
            q_num = int(m_q.group(1))
            q_text = m_q.group(2).strip()
            if curr_q:
                questions.append(curr_q)
            curr_q = {
                "num": q_num,
                "text": q_text,
                "choices": {},
                "page": pno + 1
            }
        elif curr_q:
            # Check if this line contains choices like "a- ... b- ..."
            c_matches = choice_pattern.findall(l_str)
            if c_matches:
                for c_lbl, c_val in c_matches:
                    curr_q["choices"][c_lbl.lower()] = c_val.strip()
            else:
                # If no choices matched yet, maybe question continuation or hint
                if not curr_q["choices"]:
                    curr_q["text"] += " " + l_str
                else:
                    # choices continuation
                    pass
    if curr_q:
        questions.append(curr_q)
    return questions

for p in [7, 8, 9, 10]: # pages 8, 9, 10, 11
    qs = parse_page_questions(p)
    print(f"Page {p+1}: extracted {len(qs)} questions")
    for q in qs[:3]:
        print(f"  Q{q['num']}: {q['text'][:50]}... -> choices: {list(q['choices'].keys())}")
