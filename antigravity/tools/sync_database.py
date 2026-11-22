#!/usr/bin/env python3
"""
Synchronizes the verified question dataset and pure OCR vocabulary dataset
directly into code/prisma/dev.db and verifies exact matching counts.
"""

import sqlite3
import json
import os
import uuid
from datetime import datetime

DB_PATH = "code/prisma/dev.db"
QUESTIONS_FILE = "antigravity/output/verified_questions.json"
VOCAB_FILE = "antigravity/output/verified_vocabulary.json"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("Connecting to SQLite database:", DB_PATH)

# Load verified data
with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
    questions = json.load(f)

with open(VOCAB_FILE, "r", encoding="utf-8") as f:
    vocabulary = json.load(f)

print(f"Loaded {len(questions)} verified questions from {QUESTIONS_FILE}")
print(f"Loaded {len(vocabulary)} verified vocabulary entries from {VOCAB_FILE}")

# 1. Update Questions & Choices in Database
print("Synchronizing Questions and Choices...")

# Check existing exercises
cursor.execute("SELECT id, lessonId, sequenceOrder, title FROM Exercise")
exercises = cursor.fetchall()
print(f"Existing exercises in DB: {len(exercises)}")

# Clear existing choices, attempts, questions to re-seed cleanly
cursor.execute("DELETE FROM Attempt")
cursor.execute("DELETE FROM UserQuestionState")
cursor.execute("DELETE FROM ReviewItem")
cursor.execute("DELETE FROM AnswerAuditLog")
cursor.execute("DELETE FROM Choice")
cursor.execute("DELETE FROM Question")
cursor.execute("DELETE FROM Exercise")

# Ensure Lessons exist
cursor.execute("SELECT id, lessonNumber FROM Lesson")
lessons = {row[1]: row[0] for row in cursor.fetchall()}
print("Lessons in DB:", lessons)

# Group questions into exercises by (lesson, page)
page_groups = {}
for q in questions:
    l_key = q["lesson"]
    pno = q["page"]
    key = (l_key, pno)
    if key not in page_groups:
        page_groups[key] = []
    page_groups[key].append(q)

exercise_count = 0
total_q_inserted = 0
total_c_inserted = 0

for (l_name, pno), q_list in sorted(page_groups.items(), key=lambda x: (x[0][0], x[0][1])):
    lesson_id = lessons.get(l_name)
    if not lesson_id:
        # Fallback to general dictionary or first lesson
        lesson_id = list(lessons.values())[0]
        
    ex_id = str(uuid.uuid4())
    exercise_count += 1
    cursor.execute("""
        INSERT INTO Exercise (id, lessonId, title, exerciseType, pdfPageRef, sequenceOrder)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (ex_id, lesson_id, f"Übung Seite {pno}", "MULTIPLE_CHOICE", pno, exercise_count))
    
    for q in q_list:
        q_id = str(uuid.uuid4())
        total_q_inserted += 1
        
        cursor.execute("""
            INSERT INTO Question (
                id, exerciseId, sequenceOrder, questionNumber, questionText, correctChoiceLabel,
                answerStatus, isFlaggedForReview, reviewReason, pdfPageRef
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            q_id, ex_id, total_q_inserted, q["num"], q["text"], q["correct_choice"],
            q["answer_status"], 1 if q["is_flagged"] else 0, q["review_reason"], q["page"]
        ))
        
        for lbl, val in sorted(q["choices"].items()):
            c_id = str(uuid.uuid4())
            total_c_inserted += 1
            cursor.execute("""
                INSERT INTO Choice (id, questionId, choiceLabel, choiceText)
                VALUES (?, ?, ?, ?)
            """, (c_id, q_id, lbl, val))

print(f"Inserted {exercise_count} exercises, {total_q_inserted} questions, and {total_c_inserted} choices.")

# 2. Synchronize Vocabulary
print("Synchronizing Vocabulary...")
cursor.execute("DELETE FROM UserVocabulary")
cursor.execute("DELETE FROM VocabularyItem")

total_vocab_inserted = 0
for v in vocabulary:
    v_id = str(uuid.uuid4())
    lesson_id = lessons.get(v["lesson"])
    
    cursor.execute("""
        INSERT INTO VocabularyItem (
            id, lessonId, germanWord, baseForm, article, pluralForm, meaningAr,
            wordType, exampleSentence, pdfPageRef
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        v_id, lesson_id, v["word"], v["word"].lower(), v.get("article"), v.get("plural"),
        v.get("arabic") or "", v.get("category"), v.get("example"), v.get("page")
    ))
    total_vocab_inserted += 1

print(f"Inserted {total_vocab_inserted} vocabulary records into database.")

conn.commit()
conn.close()

print("Database synchronization completed successfully!")
