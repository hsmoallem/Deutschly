"use client";

import React, { useState, useEffect } from "react";
import { Languages, CheckCircle2, Bookmark, Star, Volume2, Search, Trash2 } from "lucide-react";
import AudioPlayerButton from "@/components/AudioPlayerButton";

import { useAudio } from "@/context/AudioContext";

export default function VocabularyReviewPage() {
  const { playbackSpeed } = useAudio();
  const [vocab, setVocab] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [articleFilter, setArticleFilter] = useState("all");

  const fetchVocab = () => {
    fetch("/api/vocabulary")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVocab(data.vocabulary);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVocab();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/vocabulary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setVocab((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const articleBadges: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 border-blue-200",
    die: "bg-red-100 text-red-800 border-red-200",
    das: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const filteredVocab = vocab.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (
      articleFilter !== "all" &&
      item.article?.toLowerCase() !== articleFilter.toLowerCase()
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Languages className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Vocabulary Review (مراجعة المفردات المحفوظة)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Alle Wörter, die du beim Lernen per Doppelklick nachgeschlagen und gespeichert hast.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {["all", "learning", "difficult", "learned"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                statusFilter === st
                  ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vocab Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVocab.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
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
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {item.selectedWord}
                  </h3>
                </div>

                <AudioPlayerButton
                  text={item.selectedWord}
                  playbackSpeed={playbackSpeed}
                  size="sm"
                />
              </div>

              <div className="space-y-1 mb-4">
                <p className="text-base font-arabic font-semibold text-slate-800 dark:text-slate-200">
                  {item.meaningAr || item.meaningEn}
                </p>
                {item.baseWord && item.baseWord !== item.selectedWord && (
                  <p className="text-xs text-slate-500">
                    Grundform: <span className="font-medium">{item.baseWord}</span>
                  </p>
                )}
                {item.pluralForm && (
                  <p className="text-xs text-slate-500">
                    Plural: ..{item.pluralForm}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 capitalize">
                Status: <strong>{item.status}</strong>
              </span>

              <div className="flex items-center space-x-1">
                {item.status !== "learned" ? (
                  <button
                    onClick={() => handleUpdateStatus(item.id, "learned")}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Als gelernt markieren</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(item.id, "learning")}
                    className="px-2.5 py-1 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium"
                  >
                    Wiederholen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredVocab.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Languages className="w-10 h-10 text-brand-600 mx-auto mb-2 opacity-60" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Noch keine Vokabeln gespeichert
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Klicke beim Lernen in einer Lektion doppelt auf ein beliebiges deutsches Wort, um seine Bedeutung nachzuschlagen und es hier zu speichern.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
