import fitz
import re

pdf_path = "/Users/houssam/Library/CloudStorage/GoogleDrive-moallem.houssam@gmail.com/My Drive/German/Her Abed/عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf"
doc = fitz.open(pdf_path)

def parse_page(pno):
    page = doc[pno]
    text = page.get_text()
    lines = text.split("\n")
    
    questions = []
    curr_q = None
    
    # Question regex: line starting with number then - or . or )
    # e.g. "1-", "2-", "10.", "3 )"
    q_start_re = re.compile(r'^\s*(\d+)[\.\-\)]\s*(.+)')
    choice_split_re = re.compile(r'\b([a-dA-D])\s*[\-\.\)]\s*')
    
    for l in lines:
        l_str = l.strip()
        if not l_str:
            continue
            
        m_q = q_start_re.match(l_str)
        # Avoid matching choices like "a-", or section headers
        is_choice = bool(re.match(r'^[a-dA-D]\s*[\-\.\)]', l_str))
        
        if m_q and not is_choice:
            q_num = int(m_q.group(1))
            q_text = m_q.group(2).strip()
            if curr_q:
                questions.append(curr_q)
            curr_q = {
                "num": q_num,
                "text": q_text,
                "choices": {},
                "page": pno + 1,
                "raw_lines": [l_str]
            }
        elif curr_q:
            curr_q["raw_lines"].append(l_str)
            # Check for choices in this line
            parts = choice_split_re.split(l_str)
            if len(parts) > 1:
                # parts looks like: [prefix, 'a', 'val_a', 'b', 'val_b', ...]
                prefix = parts[0].strip()
                if prefix and not curr_q["choices"]:
                    curr_q["text"] += " " + prefix
                for i in range(1, len(parts), 2):
                    c_lbl = parts[i].lower()
                    c_val = parts[i+1].strip() if i+1 < len(parts) else ""
                    curr_q["choices"][c_lbl] = c_val
            else:
                if not curr_q["choices"]:
                    curr_q["text"] += " " + l_str
                else:
                    # Append continuation to last choice
                    last_lbl = list(curr_q["choices"].keys())[-1]
                    curr_q["choices"][last_lbl] += " " + l_str

    if curr_q:
        questions.append(curr_q)
    return questions

# Let's test on page 9
qs_p9 = parse_page(8)
print(f"Page 9: {len(qs_p9)} questions parsed.")
for q in qs_p9:
    print(f"Q{q['num']}: {q['text'][:45]}... | choices ({len(q['choices'])}): {q['choices']}")
