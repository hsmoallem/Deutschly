"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lessons")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLessons(data.lessons);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statusBadges: Record<string, { label: string; class: string; icon: any }> = {
    COMPLETED: {
      label: "Abgeschlossen",
      class: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: CheckCircle2,
    },
    IN_PROGRESS: {
      label: "In Bearbeitung",
      class: "bg-amber-100 text-amber-800 border-amber-200",
      icon: Clock,
    },
    NOT_STARTED: {
      label: "Nicht begonnen",
      class: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertCircle,
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Lektionen (Buchkapitel)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Alle 5 Lektionen aus dem Schulbuch der 3. Sekundarstufe mit interaktiven Grammatikübungen, Leseverstehen und Modellprüfungen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => {
          const statusConfig = statusBadges[lesson.status] || statusBadges.NOT_STARTED;
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={lesson.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    {lesson.lessonNumber}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusConfig.class}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {lesson.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  PDF Seiten {lesson.pdfStartPage} - {lesson.pdfEndPage} &bull; {lesson.totalQuestions} Fragen
                </p>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Lernfortschritt</span>
                    <span className="font-bold">{lesson.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${lesson.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-slate-100 dark:border-slate-800 mb-4">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-bold text-emerald-600">
                      {lesson.independentQuestions}
                    </span>
                    <span className="text-[10px] text-slate-400">Selbst</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-bold text-amber-600">
                      {lesson.difficultQuestions}
                    </span>
                    <span className="text-[10px] text-slate-400">Mit Hilfe</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-bold text-rose-600">
                      {lesson.wrongQuestions}
                    </span>
                    <span className="text-[10px] text-slate-400">Falsch</span>
                  </div>
                </div>
              </div>

              <a
                href={`/lessons/${lesson.id}`}
                className="w-full inline-flex items-center justify-center space-x-2 py-2.5 rounded-xl font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors text-xs shadow-xs"
              >
                <span>Lektion öffnen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
