import sys
import json
import simplemma
import sqlite3
import os

def lookup(word, db_path="prisma/dev.db"):
    word_clean = word.strip(".,;:!?\"'()[]{}«»„“")
    if not word_clean:
        return {"error": "Empty word"}
        
    lemma = simplemma.lemmatize(word_clean, lang="de")
    
    result = {
        "originalWord": word_clean,
        "lemma": lemma,
        "article": None,
        "pluralForm": None,
        "meaningAr": None,
        "meaningEn": None,
        "wordType": "word",
        "exampleSentence": None
    }
    
    # Try querying SQLite dev.db for matching vocabulary
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Query by word or lemma
            cursor.execute("""
                SELECT germanWord, baseForm, article, pluralForm, meaningAr, meaningEn, wordType, exampleSentence
                FROM VocabularyItem
                WHERE LOWER(germanWord) = LOWER(?) OR LOWER(baseForm) = LOWER(?) OR LOWER(germanWord) LIKE ?
                LIMIT 1
            """, (word_clean, lemma, f"%{lemma}%"))
            
            row = cursor.fetchone()
            if row:
                result["germanWord"] = row[0]
                result["baseForm"] = row[1] or lemma
                result["article"] = row[2]
                result["pluralForm"] = row[3]
                result["meaningAr"] = row[4]
                result["meaningEn"] = row[5]
                result["wordType"] = row[6] or "word"
                result["exampleSentence"] = row[7]
            conn.close()
        except Exception as e:
            result["db_error"] = str(e)
            
    # Heuristic article / gender detection if not in DB
    if not result["article"]:
        # Capitalized word usually noun in German
        if word_clean[0].isupper():
            result["wordType"] = "noun"
            # Known noun endings
            if lemma.endswith(("ung", "heit", "keit", "schaft", "tät", "tion", "ie")):
                result["article"] = "die"
            elif lemma.endswith(("chen", "lein", "ment", "um")):
                result["article"] = "das"
            elif lemma.endswith(("er", "ist", "or", "ismus")):
                result["article"] = "der"
        elif lemma.endswith("en"):
            result["wordType"] = "verb"
        elif lemma.endswith(("ig", "lich", "isch", "bar", "sam")):
            result["wordType"] = "adjective"

    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = lookup(sys.argv[1])
        print(json.dumps(res, ensure_ascii=False))
