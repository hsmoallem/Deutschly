"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Award,
  FileText,
  MessageSquare,
  Sparkles,
  Languages,
  Volume2,
  Search,
  ExternalLink,
} from "lucide-react";
import InteractiveExerciseCard, {
  QuestionData,
} from "@/components/InteractiveExerciseCard";
import AudioPlayerButton from "@/components/AudioPlayerButton";
import { useAudio } from "@/context/AudioContext";

export default function LessonDetailPage() {
  const { playbackSpeed } = useAudio();
  const params = useParams();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"exercises" | "reading" | "situations" | "grammar" | "vocabulary">("exercises");
  
  // Exercise filter
  const [questionFilter, setQuestionFilter] = useState<string>("all");
  
  // Vocabulary search & filter
  const [vocabSearch, setVocabSearch] = useState<string>("");
  const [vocabArticle, setVocabArticle] = useState<string>("all");

  const [stats, setStats] = useState({
    total: 0,
    solved: 0,
    difficult: 0,
    wrong: 0,
    pending: 0,
  });

  const fetchLesson = () => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLesson(data.lesson);
          computeStats(data.lesson);
        }
      })
      .catch((err) => console.error("Fetch lesson error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const computeStats = (les: any) => {
    let tot = 0,
      sol = 0,
      dif = 0,
      wro = 0,
      pen = 0;
    les.exercises.forEach((ex: any) => {
      ex.questions.forEach((q: any) => {
        tot++;
        const c = q.userState?.classification;
        if (c === "SOLVED_INDEPENDENTLY") sol++;
        else if (c === "DIFFICULT") dif++;
        else if (c === "WRONG") wro++;
        else pen++;
      });
    });
    setStats({ total: tot, solved: sol, difficult: dif, wrong: wro, pending: pen });
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Lade Lektion & Inhalte...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold">Lektion nicht gefunden</h2>
        <a
          href="/lessons"
          className="mt-4 inline-flex items-center space-x-2 text-sm text-brand-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </a>
      </div>
    );
  }

  const completionPercent =
    stats.total > 0
      ? Math.round(((stats.solved + stats.difficult) / stats.total) * 100)
      : 0;

  // Separate exercises by type
  const readingExercises = lesson.exercises.filter((ex: any) => ex.exerciseType === "reading" || ex.passageText);
  const situationsExercises = lesson.exercises.filter((ex: any) => ex.exerciseType === "situations");
  const grammarExercises = lesson.exercises.filter(
    (ex: any) => ex.exerciseType !== "reading" && ex.exerciseType !== "situations" && !ex.passageText
  );

  // Filter questions for the general exercises tab
  const filterQuestions = (questions: QuestionData[]) => {
    return questions.filter((q) => {
      if (questionFilter === "all") return true;
      if (questionFilter === "pending")
        return (
          !q.userState?.classification ||
          q.userState?.classification === "PENDING"
        );
      if (questionFilter === "difficult")
        return q.userState?.classification === "DIFFICULT";
      if (questionFilter === "wrong") return q.userState?.classification === "WRONG";
      if (questionFilter === "solved")
        return q.userState?.classification === "SOLVED_INDEPENDENTLY";
      return true;
    });
  };

  // Filter lesson vocabulary
  const filteredVocabulary = (lesson.vocabulary || []).filter((item: any) => {
    if (vocabArticle !== "all" && item.article?.toLowerCase() !== vocabArticle.toLowerCase()) {
      return false;
    }
    if (vocabSearch.trim()) {
      const q = vocabSearch.toLowerCase();
      const de = item.germanWord?.toLowerCase() || "";
      const ar = item.meaningAr?.toLowerCase() || "";
      return de.includes(q) || ar.includes(q);
    }
    return true;
  });

  const articleBadges: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    die: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    das: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <a
            href="/lessons"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zurück zur Lektionenübersicht</span>
          </a>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold text-sm">
              {lesson.lessonNumber}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lesson.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Original PDF Seiten {lesson.pdfStartPage} bis {lesson.pdfEndPage} &bull; {stats.total} interaktive Fragen &bull; {lesson.vocabulary?.length || 0} Vokabeln
          </p>
        </div>

        {/* Completion Indicator */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-xs">
          <Award className="w-5 h-5 text-brand-600" />
          <div>
            <div className="text-xs text-slate-400">Fortschritt:</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {completionPercent}% abgeschlossen
            </div>
          </div>
        </div>
      </div>

      {/* Primary Lesson Sections Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("exercises")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "exercises"
              ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4 text-brand-600" />
          <span>Übungen & Fragen ({stats.total})</span>
        </button>

        <button
          onClick={() => setActiveTab("reading")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "reading"
              ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Leseverstehen ({readingExercises.length} Texte)</span>
        </button>

        <button
          onClick={() => setActiveTab("situations")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "situations"
              ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Alltagssituationen ({situationsExercises.length} Abschnitte)</span>
        </button>

        <button
          onClick={() => setActiveTab("grammar")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "grammar"
              ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Grammatik ({lesson.grammarTopics?.length || 0} Themen)</span>
        </button>

        <button
          onClick={() => setActiveTab("vocabulary")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "vocabulary"
              ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Languages className="w-4 h-4 text-rose-600" />
          <span>Lektionswortschatz ({lesson.vocabulary?.length || 0} Wörter)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ÜBUNGEN & FRAGEN (GROUPED BY EXERCISE)                              */}
      {/* ========================================================================= */}
      {activeTab === "exercises" && (
        <div className="space-y-6">
          {/* Question Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setQuestionFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                questionFilter === "all"
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setQuestionFilter("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                questionFilter === "pending"
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              Offen ({stats.pending})
            </button>
            <button
              onClick={() => setQuestionFilter("difficult")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                questionFilter === "difficult"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              Mit Hilfe ({stats.difficult})
            </button>
            <button
              onClick={() => setQuestionFilter("wrong")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                questionFilter === "wrong"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              Falsch ({stats.wrong})
            </button>
            <button
              onClick={() => setQuestionFilter("solved")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                questionFilter === "solved"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
              }`}
            >
              Selbst gelöst ({stats.solved})
            </button>
          </div>

          {/* Exercises Loop */}
          {lesson.exercises.map((ex: any) => {
            const filtered = filterQuestions(ex.questions);
            if (filtered.length === 0 && questionFilter !== "all") return null;

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800">
                        Seite {ex.pdfPageRef}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {ex.title}
                      </h2>
                    </div>
                    {ex.instructions && (
                      <p className="text-xs text-slate-500 mt-1">{ex.instructions}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {filtered.length} Fragen
                  </span>
                </div>

                <div className="space-y-4">
                  {filtered.map((q: any) => (
                    <InteractiveExerciseCard
                      key={q.id}
                      question={q}
                      playbackSpeed={playbackSpeed}
                      onAttemptSubmitted={() => fetchLesson()}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LESEVERSTEHEN (READING PASSAGES)                                   */}
      {/* ========================================================================= */}
      {activeTab === "reading" && (
        <div className="space-y-8">
          {readingExercises.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 dark:text-white">Keine Lesetexte in dieser Lektion</h3>
            </div>
          ) : (
            readingExercises.map((ex: any, idx: number) => (
              <div
                key={ex.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-950/60 shadow-xs overflow-hidden"
              >
                {/* Passage Header */}
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 px-6 py-4 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                      Lesetext {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      Original PDF Seite {ex.pdfPageRef}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {ex.title}
                  </h2>
                </div>

                {/* German Reading Passage Card */}
                <div className="p-6 bg-indigo-50/20 dark:bg-slate-900/40 border-b border-indigo-50 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Deutscher Lesetext (Lies den folgenden Text!):
                    </span>
                    {ex.passageText && (
                      <AudioPlayerButton
                        text={ex.passageText}
                        playbackSpeed={playbackSpeed}
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                    {ex.passageText}
                  </div>
                </div>

                {/* Questions for this Passage */}
                <div className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Fragen zum Text ({ex.questions.length} Fragen):</span>
                  </h3>
                  <div className="space-y-4">
                    {ex.questions.map((q: any) => (
                      <InteractiveExerciseCard
                        key={q.id}
                        question={q}
                        playbackSpeed={playbackSpeed}
                        onAttemptSubmitted={() => fetchLesson()}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALLTAGSSITUATIONEN (SITUATIONS)                                    */}
      {/* ========================================================================= */}
      {activeTab === "situations" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3">
            <MessageSquare className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Alltagssituationen (المواقف اليومية)
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                تدريبات المواقف اليومية في امتحان الثانوية العامة الألماني. اختر الرد المناسب لكل موقف محادثة واقعي.
              </p>
            </div>
          </div>

          {situationsExercises.map((ex: any) => (
            <div
              key={ex.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    Seite {ex.pdfPageRef}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {ex.title}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">{ex.questions.length} Situationen</span>
              </div>

              <div className="space-y-4">
                {ex.questions.map((q: any) => (
                  <InteractiveExerciseCard
                    key={q.id}
                    question={q}
                    playbackSpeed={playbackSpeed}
                    onAttemptSubmitted={() => fetchLesson()}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GRAMMATIK (GRAMMAR TOPICS)                                         */}
      {/* ========================================================================= */}
      {activeTab === "grammar" && (
        <div className="space-y-6">
          {(!lesson.grammarTopics || lesson.grammarTopics.length === 0) ? (
            <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900 dark:text-white">Keine Grammatikthemen hinterlegt</h3>
            </div>
          ) : (
            lesson.grammarTopics.map((topic: any, idx: number) => (
              <div
                key={topic.id || idx}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-950/60 p-6 shadow-xs space-y-4"
              >
                {/* Topic Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-100 dark:border-amber-900/40">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs">
                      Thema {idx + 1}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {topic.titleDe}
                      </h2>
                      <p className="text-sm font-arabic font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                        {topic.titleAr}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                    Original PDF Seite {topic.pdfPage}
                  </span>
                </div>

                {/* Summary / Explanation */}
                {topic.summary && (
                  <p className="text-sm font-arabic font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    {topic.summary}
                  </p>
                )}

                {/* Rules Checklist */}
                {topic.rules && topic.rules.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      قواعد وشرح الدرس:
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {topic.rules.map((rule: string, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="flex items-start space-x-2 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <span className="font-arabic leading-relaxed">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Example Sentences */}
                {topic.examples && topic.examples.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      أمثلة من كتاب الشرح:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {topic.examples.map((ex: any, eIdx: number) => (
                        <div
                          key={eIdx}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-bold text-brand-700 dark:text-brand-300 font-sans">
                              {ex.de}
                            </span>
                            <AudioPlayerButton text={ex.de} playbackSpeed={playbackSpeed} size="sm" />
                          </div>
                          <span className="text-xs font-arabic font-medium text-slate-600 dark:text-slate-400 text-right">
                            {ex.ar}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LEKTIONSWORTSCHATZ (LESSON VOCABULARY)                              */}
      {/* ========================================================================= */}
      {activeTab === "vocabulary" && (
        <div className="space-y-6">
          {/* Vocab Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Wort auf Deutsch oder Arabisch suchen..."
                value={vocabSearch}
                onChange={(e) => setVocabSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              {["all", "der", "das", "die"].map((art) => (
                <button
                  key={art}
                  onClick={() => setVocabArticle(art)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                    vocabArticle === art
                      ? "bg-brand-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {art}
                </button>
              ))}
            </div>
          </div>

          {/* Vocab Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocabulary.map((item: any) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {item.article && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${
                            articleBadges[item.article.toLowerCase()] || "bg-slate-100"
                          }`}
                        >
                          {item.article}
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {item.germanWord}
                      </h4>
                    </div>
                    <AudioPlayerButton text={item.germanWord} playbackSpeed={playbackSpeed} size="sm" />
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="text-base font-arabic font-bold text-slate-800 dark:text-slate-100 text-right">
                      {item.meaningAr}
                    </p>
                    {item.pluralForm && (
                      <p className="text-xs text-slate-500">
                        Plural: <span className="font-medium font-sans">..{item.pluralForm}</span>
                      </p>
                    )}
                    {item.exampleSentence && (
                      <p className="text-xs text-brand-700 dark:text-brand-300 italic bg-brand-50/50 dark:bg-brand-950/20 p-2 rounded-lg mt-2 font-sans">
                        "{item.exampleSentence}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Seite {item.pdfPageRef}</span>
                  <span className="capitalize">{item.wordType}</span>
                </div>
              </div>
            ))}

            {filteredVocabulary.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                <Languages className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Keine Vokabeln gefunden</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
