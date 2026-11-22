const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Create Default Users (password hash for 'password123')
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: {},
    create: {
      username: 'student',
      email: 'student@deutschly.com',
      passwordHash: hashedPassword,
      role: 'student',
      settings: {
        create: {
          preferredVoice: 'de-DE',
          playbackSpeed: 1.0,
          theme: 'light'
        }
      }
    }
  });
  console.log(`User created: ${student.username}`);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@deutschly.com',
      passwordHash: hashedPassword,
      role: 'admin',
      settings: {
        create: {
          preferredVoice: 'de-DE',
          playbackSpeed: 1.0,
          theme: 'light'
        }
      }
    }
  });
  console.log(`Admin created: ${admin.username}`);

  // 2. Create Book
  const book = await prisma.book.create({
    data: {
      title: "منهج اللغة الألمانية للصف الثالث الثانوي - الأستاذ عبد الرؤوف",
      author: "عبد الرؤوف / منة الله رمضان",
      language: "de",
      sourcePdf: "عبد الرؤؤف الكتاب جديد جداااااااا- 2027.pdf",
      totalPages: 152
    }
  });
  console.log(`Book created: ${book.title}`);

  // 3. Create Lessons
  const lessonData = [
    { num: "Lektion 10", title: "Gesundheit, Krankheit & Befinden", start: 1, end: 24, order: 1 },
    { num: "Lektion 11", title: "In der Stadt unterwegs", start: 25, end: 53, order: 2 },
    { num: "Lektion 12", title: "Der Kunde ist König", start: 54, end: 78, order: 3 },
    { num: "Lektion 13", title: "Kleidung / Im Kaufhaus", start: 79, end: 112, order: 4 },
    { num: "Lektion 14", title: "Die Feste & Einladungen", start: 113, end: 138, order: 5 },
    { num: "قاموس الكلمات", title: "General German-Arabic Dictionary", start: 139, end: 147, order: 6 },
    { num: "ملاحظات الطالب", title: "Student Practice & Notes Pages", start: 148, end: 152, order: 7 }
  ];

  const lessonMap = {};
  for (const l of lessonData) {
    const created = await prisma.lesson.create({
      data: {
        bookId: book.id,
        sequenceOrder: l.order,
        lessonNumber: l.num,
        title: l.title,
        pdfStartPage: l.start,
        pdfEndPage: l.end
      }
    });
    lessonMap[l.num] = created.id;
  }
  console.log("Created 7 lesson/reference sections.");

  // 4. Load Extracted Questions
  let questionsPath = path.join(__dirname, '../antigravity/output/extracted_questions.json');
  if (!fs.existsSync(questionsPath)) {
    questionsPath = path.join(__dirname, '../../antigravity/output/extracted_questions.json');
  }
  if (fs.existsSync(questionsPath)) {
    const rawQuestions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    console.log(`Loading ${rawQuestions.length} extracted questions...`);

    // Group questions by exercise per lesson
    const exerciseMap = {};

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const lessonId = lessonMap[q.lesson] || lessonMap["Lektion 10"];
      const exKey = `${lessonId}_p${q.page}`;

      if (!exerciseMap[exKey]) {
        const ex = await prisma.exercise.create({
          data: {
            lessonId: lessonId,
            exerciseType: "grammar_drill",
            title: `Übung (Seite ${q.page})`,
            instructions: "Wähle die richtige Antwort aus!",
            pdfPageRef: q.page,
            sequenceOrder: Object.keys(exerciseMap).length + 1
          }
        });
        exerciseMap[exKey] = ex.id;
      }

      const exId = exerciseMap[exKey];

      const createdQ = await prisma.question.create({
        data: {
          exerciseId: exId,
          sequenceOrder: i + 1,
          questionNumber: q.num,
          questionText: q.question_text,
          correctChoiceLabel: q.correct_answer || "a",
          answerStatus: q.answer_status || "AI_CHECKED",
          isFlaggedForReview: q.is_flagged_for_review || false,
          reviewReason: q.review_reason || null,
          pdfPageRef: q.page
        }
      });

      // Insert choices
      for (const [lbl, txt] of Object.entries(q.choices)) {
        await prisma.choice.create({
          data: {
            questionId: createdQ.id,
            choiceLabel: lbl,
            choiceText: txt
          }
        });
      }
    }
    console.log(`Successfully seeded ${rawQuestions.length} questions and choices!`);
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
