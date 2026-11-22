/**
 * Comprehensive Automated Test Suite for Deutschly Platform
 * Tests authentication, authorization (admin/student RBAC), learning engine classification state machine,
 * hint generation, known benchmark answers, vocabulary integrity, and database census.
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "deutschly_dev_local_secret_key_9876543210";
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Cookie'] = `deutschly_token=${token}`;
    }
    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, data: json, raw: data });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING REAL COMPREHENSIVE AUTOMATED TEST SUITE");
  console.log("=================================================\n");

  // Fetch student and admin test users
  const student = await prisma.user.findUnique({ where: { username: 'student' } });
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });

  assert(student !== null, "Student user exists in database");
  assert(admin !== null, "Admin user exists in database");

  const studentToken = jwt.sign({ userId: student.id, username: student.username, role: student.role }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });

  // 1. Core Endpoints
  console.log("\n--- TEST GROUP 1: Core Navigation & Lessons ---");
  const homeRes = await request('GET', '/');
  assert(homeRes.status === 200, "Home page (/) returns HTTP 200 OK");

  const lessonsRes = await request('GET', '/api/lessons');
  assert(lessonsRes.status === 200, "API /api/lessons returns HTTP 200 OK");
  assert(lessonsRes.data && lessonsRes.data.lessons && lessonsRes.data.lessons.length >= 5, "API /api/lessons returns all curriculum lessons");

  // 2. Security & RBAC Tests
  console.log("\n--- TEST GROUP 2: Security & Authorization (RBAC) ---");
  const anonAdminRes = await request('GET', '/api/admin/questions');
  assert(anonAdminRes.status === 401, "Unauthenticated access to /api/admin/questions is blocked with 401 Unauthorized");

  const studentAdminRes = await request('GET', '/api/admin/questions', null, studentToken);
  assert(studentAdminRes.status === 403, "Student access to /api/admin/questions is strictly blocked with 403 Forbidden");

  const adminAccessRes = await request('GET', '/api/admin/questions?limit=5', null, adminToken);
  assert(adminAccessRes.status === 200, "Admin access to /api/admin/questions succeeds with 200 OK");

  // 3. Known Benchmark Questions Verification
  console.log("\n--- TEST GROUP 3: Benchmark Question & Choice Verification ---");
  // Known benchmark questions from textbook
  const p8q9 = await prisma.question.findFirst({ where: { pdfPageRef: 8, questionNumber: 9 }, include: { choices: true } });
  assert(p8q9 !== null, "Page 8 Q9 exists");
  if (p8q9) {
    assert(p8q9.correctChoiceLabel.toLowerCase() === 'c', `Page 8 Q9 correct answer is 'c' (actual: '${p8q9.correctChoiceLabel}')`);
    const cChoice = p8q9.choices.find(c => c.choiceLabel.toLowerCase() === 'c');
    assert(cChoice && cChoice.choiceText.includes('nehmen'), "Page 8 Q9 choice 'c' contains 'nehmen'");
  }

  const p8q14 = await prisma.question.findFirst({ where: { pdfPageRef: 8, questionNumber: 14 }, include: { choices: true } });
  assert(p8q14 !== null, "Page 8 Q14 exists");
  if (p8q14) {
    assert(p8q14.correctChoiceLabel.toLowerCase() === 'd', `Page 8 Q14 correct answer is 'd' (actual: '${p8q14.correctChoiceLabel}')`);
  }

  const p8q18 = await prisma.question.findFirst({ where: { pdfPageRef: 8, questionNumber: 18 }, include: { choices: true } });
  assert(p8q18 !== null, "Page 8 Q18 exists");
  if (p8q18) {
    assert(p8q18.correctChoiceLabel.toLowerCase() === 'b', `Page 8 Q18 correct answer is 'b' (actual: '${p8q18.correctChoiceLabel}')`);
  }

  const p8q20 = await prisma.question.findFirst({ where: { pdfPageRef: 8, questionNumber: 20 }, include: { choices: true } });
  assert(p8q20 !== null, "Page 8 Q20 exists");
  if (p8q20) {
    assert(p8q20.correctChoiceLabel.toLowerCase() === 'b', `Page 8 Q20 correct answer is 'b' (actual: '${p8q20.correctChoiceLabel}')`);
  }

  const p8q21 = await prisma.question.findFirst({ where: { pdfPageRef: 8, questionNumber: 21 }, include: { choices: true } });
  assert(p8q21 !== null, "Page 8 Q21 exists");
  if (p8q21) {
    assert(p8q21.choices.length === 4, `Page 8 Q21 has exactly 4 choices (actual: ${p8q21.choices.length})`);
    const cChoice = p8q21.choices.find(c => c.choiceLabel.toLowerCase() === 'c');
    assert(cChoice && !cChoice.choiceText.includes("Die Modalverben"), "Page 8 Q21 choice 'c' did NOT swallow grammar table 'Die Modalverben'");
  }

  const p9q9 = await prisma.question.findFirst({ where: { pdfPageRef: 9, questionNumber: 9 }, include: { choices: true } });
  assert(p9q9 !== null, "Page 9 Q9 exists");
  if (p9q9) {
    assert(p9q9.choices.length === 4, `Page 9 Q9 has exactly 4 choices (actual: ${p9q9.choices.length})`);
    assert(p9q9.correctChoiceLabel.toLowerCase() === 'a', `Page 9 Q9 correct answer is 'a' (actual: '${p9q9.correctChoiceLabel}')`);
  }

  // 4. Learning Rules & Attempt Engine Tests
  console.log("\n--- TEST GROUP 4: Learning Rules State Machine ---");
  // Find a verified AI_CHECKED question for attempt testing
  const testQ = await prisma.question.findFirst({ where: { answerStatus: 'AI_CHECKED', isFlaggedForReview: false } });
  assert(testQ !== null, "Found verified AI_CHECKED question for attempt testing");

  if (testQ) {
    // Clean prior attempts on this test question
    await prisma.attempt.deleteMany({ where: { userId: student.id, questionId: testQ.id } });
    await prisma.userQuestionState.deleteMany({ where: { userId: student.id, questionId: testQ.id } });

    // Test 4.1: Revealing choices alone does NOT count as assistance -> SOLVED_INDEPENDENTLY
    const revealAttempt = await request('POST', '/api/attempts/submit', {
      questionId: testQ.id,
      submittedChoice: testQ.correctChoiceLabel,
      revealedChoices: true,
      usedHint: false
    }, studentToken);

    assert(revealAttempt.status === 200, "Submission on verified question returns 200 OK");
    assert(revealAttempt.data && revealAttempt.data.classification === 'SOLVED_INDEPENDENTLY', 
      "Revealing choices alone does NOT change status -> Classified as SOLVED_INDEPENDENTLY");

    // Test 4.2: Hint Generation on Demand (For statistics only, does not change status by itself)
    const hintRes = await request('POST', '/api/hints/generate', { questionId: testQ.id }, studentToken);
    assert(hintRes.status === 200, "Hint request returns HTTP 200 OK");
    assert(hintRes.data && hintRes.data.isAiHint === true, "Hint response is labeled 'isAiHint: true'");
    assert(hintRes.data && !hintRes.data.hint.includes(testQ.correctChoiceLabel), "Pedagogical hint does NOT give away the answer choice");

    // Test 4.3: Correct answer after using hint is still marked correct (Hint does NOT change status by itself)
    const hintSubmit = await request('POST', '/api/attempts/submit', {
      questionId: testQ.id,
      submittedChoice: testQ.correctChoiceLabel,
      revealedChoices: true,
      usedHint: true
    }, studentToken);
    assert(hintSubmit.data && hintSubmit.data.classification === 'SOLVED_INDEPENDENTLY',
      "AI Hint is for statistics only -> Correct answer with hint is classified as SOLVED_INDEPENDENTLY");

    // Test 4.4: Wrong answer retry updates status to WRONG, but preserves lesson completion
    const wrongChoice = ['a', 'b', 'c', 'd'].find(c => c !== testQ.correctChoiceLabel.toLowerCase());
    const retryWrong = await request('POST', '/api/attempts/submit', {
      questionId: testQ.id,
      submittedChoice: wrongChoice,
      revealedChoices: true,
      usedHint: false
    }, studentToken);
    assert(retryWrong.data && retryWrong.data.classification === 'WRONG',
      "Wrong answer is marked WRONG and routes to Wrong Answers list");

    const stateAfterWrong = await prisma.userQuestionState.findUnique({
      where: { userId_questionId: { userId: student.id, questionId: testQ.id } }
    });
    assert(stateAfterWrong && stateAfterWrong.isCompletedSuccessfully === true,
      "Question retried wrong retains isCompletedSuccessfully: true (lesson stays completed)");

    // Test 4.5: Difficult is MANUAL ONLY
    const manualDiffRes = await request('POST', '/api/review-list', {
      questionId: testQ.id,
      listType: 'DIFFICULT'
    }, studentToken);
    assert(manualDiffRes.status === 200, "Student can manually mark any question as Difficult at any time");

    const diffCount = await prisma.reviewItem.count({
      where: { userId: student.id, questionId: testQ.id, listType: 'DIFFICULT', isManuallyRemoved: false }
    });
    assert(diffCount === 1, "Question is present in DIFFICULT review list after manual marking");

    // Test 4.6: Removing question from review list by hand never deletes attempts
    const attemptsCountBefore = await prisma.attempt.count({ where: { userId: student.id, questionId: testQ.id } });
    const removeRes = await request('DELETE', '/api/review-list', {
      questionId: testQ.id,
      listType: 'DIFFICULT'
    }, studentToken);
    assert(removeRes.status === 200, "Manual removal from Difficult list returns 200 OK");

    const attemptsCountAfter = await prisma.attempt.count({ where: { userId: student.id, questionId: testQ.id } });
    assert(attemptsCountBefore === attemptsCountAfter, "Manual removal from Difficult list preserves full attempt history");
  }

  // Test 4.3: Flagged for review questions are excluded from student submission
  const flaggedQ = await prisma.question.findFirst({ where: { isFlaggedForReview: true } });
  if (flaggedQ) {
    const flaggedAttempt = await request('POST', '/api/attempts/submit', {
      questionId: flaggedQ.id,
      submittedChoice: 'a',
      usedHint: false
    }, studentToken);
    assert(flaggedAttempt.status === 400 && flaggedAttempt.data.requiresReview === true, 
      "Submission on REQUIRES_REVIEW question is rejected with 400 and requiresReview flag");
  }

  // 5. Vocabulary Integrity Tests
  console.log("\n--- TEST GROUP 5: Vocabulary Integrity & Pure OCR ---");
  const bogusWords = ['Der', 'Sie', 'Mein', 'Du', 'Ich', 'Am', 'Andi'];
  const bogusCount = await prisma.vocabularyItem.count({ where: { germanWord: { in: bogusWords } } });
  assert(bogusCount === 0, `Zero sentence fragments imported as vocabulary words (found: ${bogusCount})`);

  const fillerCount = await prisma.vocabularyItem.count({ where: { meaningAr: { contains: 'انظر شرح الدرس' } } });
  assert(fillerCount === 0, `Zero generic filler lines 'انظر شرح الدرس' in vocabulary (found: ${fillerCount})`);

  const wemVocab = await prisma.vocabularyItem.findFirst({ where: { germanWord: { contains: 'Wem' } } });
  assert(wemVocab !== null, "Page 145 'Wem? (Dativ)' exists in vocabulary");
  if (wemVocab) {
    assert(wemVocab.meaningAr && wemVocab.meaningAr.includes('من'), "Page 145 'Wem? (Dativ)' contains proper Arabic translation 'من'");
  }

  // 6. Master Lexicon & Clean Arabic Verification
  console.log("\n--- TEST GROUP 6: Master Lexicon & Clean Arabic ---");
  const dictRes = await request('GET', '/api/dictionary/search?lesson=all&limit=60');
  assert(dictRes.status === 200, "Master Lexicon API returns 200 OK");
  assert(dictRes.data && dictRes.data.total === 1840, `Master Lexicon contains all 1,840 verified vocabulary items (actual: ${dictRes.data?.total})`);
  assert(dictRes.data && dictRes.data.totalPages === 31, `Master Lexicon pagination has 31 pages at 60/page (actual: ${dictRes.data?.totalPages})`);

  const emptyArCount = await prisma.vocabularyItem.count({
    where: { OR: [{ meaningAr: null }, { meaningAr: '' }] }
  });
  assert(emptyArCount === 0, `Zero empty Arabic meanings in entire vocabulary database (actual: ${emptyArCount})`);

  const badTagsCount = await prisma.vocabularyItem.count({
    where: { germanWord: { in: ['(Akk)', '(Dativ)', 'Das', 'Die', 'g', 'p'] } }
  });
  assert(badTagsCount === 0, `Zero non-words or standalone grammar tags in vocabulary (actual: ${badTagsCount})`);

  const noisyOcrCount = await prisma.vocabularyItem.count({
    where: { meaningAr: { contains: '0000' } }
  });
  assert(noisyOcrCount === 0, `Zero OCR digit noise '0000' in vocabulary meanings (actual: ${noisyOcrCount})`);

  console.log("\n=================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED (TOTAL: ${testsRun})`);
  console.log("=================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
