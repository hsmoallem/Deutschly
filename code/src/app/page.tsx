"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Languages,
  ArrowRight,
  TrendingUp,
  BookmarkCheck,
  Award,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/lessons").then((r) => r.json()),
    ])
      .then(([statsRes, lessonsRes]) => {
        if (statsRes.success) setStats(statsRes.stats);
        if (lessonsRes.success) setLessons(lessonsRes.lessons);
      })
      .catch((err) => console.error("Dashboard data error:", err))
      .finally(() => setLoading(false));
  }, []);

  const completedLessonsCount =
    lessons.filter((l) => l.status === "COMPLETED").length;
  const inProgressLessonsCount =
    lessons.filter((l) => l.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-700 via-brand-600 to-indigo-700 p-8 text-white shadow-xl shadow-brand-700/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-4 text-white">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Deutsch Lernen &bull; 3. Sekundarstufe</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Willkommen bei Deutschly
          </h1>
          <p className="mt-2 text-brand-100 text-sm sm:text-base leading-relaxed">
            Dein interaktiver Lernbegleiter für das deutsche Schulbuch. Übe mit
            allen 1.578 Fragen, lerne Vokabeln mit Doppelklick und höre die
            authentische Aussprache.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/lessons"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-white text-brand-700 hover:bg-brand-50 shadow-md transition-all active:scale-98 text-sm"
            >
              <span>Lektionen starten</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/admin"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-brand-800/60 hover:bg-brand-800 text-white border border-white/20 transition-all text-sm"
            >
              <span>Verification / Admin</span>
            </a>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gesamte Fragen</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.totalQuestions || 1578}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Across 5 core curriculum lessons
          </p>
        </div>

        {/* Solved Independently */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Selbst gelöst</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {stats?.solvedIndependently || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Ohne Hilfe beantwortet</p>
        </div>

        {/* Difficult Questions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Mit Hilfe (Schwer)</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {stats?.difficultCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mit Hinweisen / Aufdecken
          </p>
        </div>

        {/* Wrong Answers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Falsche Antworten</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {stats?.wrongCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aktive Wiederholungsfragen
          </p>
        </div>
      </div>

      {/* Progress & Lessons Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Completion */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Lernfortschritt (Buch)
              </h2>
              <Award className="w-5 h-5 text-brand-600" />
            </div>

            <div className="flex items-baseline space-x-2 my-4">
              <span className="text-4xl font-extrabold text-brand-600">
                {stats?.overallProgressPercent || 0}%
              </span>
              <span className="text-xs text-slate-500">abgeschlossen</span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-6">
              <div
                className="bg-brand-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats?.overallProgressPercent || 0}%` }}
              />
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Abgeschlossene Lektionen:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {completedLessonsCount} / 5
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>In Bearbeitung:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {inProgressLessonsCount}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Gespeicherte Vokabeln:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats?.savedVocabCount || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <a
              href="/lessons"
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-slate-800 dark:text-brand-300 transition-colors"
            >
              <span>Alle Lektionen anzeigen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Lessons List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Buchkapitel (Lektion 10 bis 14)
            </h2>
            <span className="text-xs text-slate-400">5 Hauptlektionen</span>
          </div>

          <div className="space-y-3">
            {lessons.slice(0, 5).map((lesson) => (
              <a
                key={lesson.id}
                href={`/lessons/${lesson.id}`}
                className="group block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                        {lesson.lessonNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-brand-600 transition-colors">
                        {lesson.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF Seiten {lesson.pdfStartPage} - {lesson.pdfEndPage} &bull; {lesson.totalQuestions} interaktive Fragen
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lesson.progressPercent}%
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-brand-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${lesson.progressPercent}%` }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
