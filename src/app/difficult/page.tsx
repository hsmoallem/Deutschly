"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, Trash2, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import InteractiveExerciseCard from "@/components/InteractiveExerciseCard";

import { useAudio } from "@/context/AudioContext";

export default function DifficultQuestionsPage() {
  const { playbackSpeed } = useAudio();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchItems = () => {
    fetch("/api/review-list?type=DIFFICULT")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setItems(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRemove = async (questionId: string) => {
    try {
      const res = await fetch("/api/review-list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, listType: "DIFFICULT" }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.question.id !== questionId));
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error("Remove review error:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Difficult Questions (Schwierige Fragen)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fragen, die du mit Hilfe (Hinweise oder Aufdecken) richtig beantwortet hast. Übe sie erneut, um sie selbstständig zu meistern.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full font-bold text-xs">
          {items.length} Fragen
        </span>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.reviewId}
            className="relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {item.question.lessonNumber} &bull; {item.question.lessonTitle} (PDF p. {item.question.pdfPageRef})
              </span>

              {confirmDeleteId === item.question.id ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-rose-600 font-medium">Wirklich entfernen?</span>
                  <button
                    onClick={() => handleRemove(item.question.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Ja, entfernen
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  >
                    Abbrechen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(item.question.id)}
                  title="Aus der Liste schwieriger Fragen entfernen"
                  className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Entfernen</span>
                </button>
              )}
            </div>

            <div className="p-4">
              <InteractiveExerciseCard
                question={{
                  id: item.question.id,
                  questionNumber: item.question.num,
                  questionText: item.question.text,
                  correctChoiceLabel: item.question.correctChoiceLabel,
                  answerStatus: item.question.answerStatus,
                  pdfPageRef: item.question.pdfPageRef,
                  choices: item.question.choices,
                  userState: {
                    classification: "DIFFICULT",
                    isCompleted: true,
                    attemptsCount: item.question.attempts.length,
                  },
                }}
                playbackSpeed={playbackSpeed}
                onAttemptSubmitted={() => fetchItems()}
              />
            </div>
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Keine schwierigen Fragen vorhanden!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Fragen, bei denen du Hinweise oder das Aufdecken nutzt, erscheinen automatisch hier zur Wiederholung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
