"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Filter,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Award,
} from "lucide-react";
import InteractiveExerciseCard, {
  QuestionData,
} from "@/components/InteractiveExerciseCard";

import { useAudio } from "@/context/AudioContext";

export default function LessonDetailPage() {
  const { playbackSpeed } = useAudio();
  const params = useParams();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all"); // "all", "pending", "difficult", "wrong", "solved"
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
        <p className="text-sm text-slate-500 font-medium">Lade Lektion...</p>
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

  // Filter questions
  const allQuestions: QuestionData[] = lesson.exercises.flatMap(
    (ex: any) => ex.questions
  );

  const filteredQuestions = allQuestions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "pending")
      return (
        !q.userState?.classification ||
        q.userState?.classification === "PENDING"
      );
    if (filter === "difficult")
      return q.userState?.classification === "DIFFICULT";
    if (filter === "wrong") return q.userState?.classification === "WRONG";
    if (filter === "solved")
      return q.userState?.classification === "SOLVED_INDEPENDENTLY";
    return true;
  });

  const completionPercent =
    stats.total > 0
      ? Math.round(((stats.solved + stats.difficult) / stats.total) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Info */}
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
            Original PDF Seiten {lesson.pdfStartPage} - {lesson.pdfEndPage} &bull; {stats.total} interaktive Fragen
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === "all"
              ? "bg-brand-600 text-white border-brand-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          Alle ({stats.total})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === "pending"
              ? "bg-slate-700 text-white border-slate-700"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          Noch offen ({stats.pending})
        </button>
        <button
          onClick={() => setFilter("difficult")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === "difficult"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          Mit Hilfe ({stats.difficult})
        </button>
        <button
          onClick={() => setFilter("wrong")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === "wrong"
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          Falsch ({stats.wrong})
        </button>
        <button
          onClick={() => setFilter("solved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
            filter === "solved"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
          }`}
        >
          Selbst gelöst ({stats.solved})
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => (
          <InteractiveExerciseCard
            key={q.id}
            question={q}
            playbackSpeed={playbackSpeed}
            onAttemptSubmitted={() => fetchLesson()}
          />
        ))}

        {filteredQuestions.length === 0 && (
          <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Keine Fragen in dieser Kategorie
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Wähle einen anderen Filter, um weitere Fragen zu üben.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
