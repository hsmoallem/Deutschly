"use client";

import React, { useState, useEffect } from "react";
import { BookA, Search, Filter, Volume2, BookmarkPlus, Check } from "lucide-react";
import AudioPlayerButton from "@/components/AudioPlayerButton";

import { useAudio } from "@/context/AudioContext";

export default function DictionaryPage() {
  const { playbackSpeed } = useAudio();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string>("all");
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Search lookup API or load initial dictionary sample
    fetchVocab();
  }, [selectedArticle]);

  const fetchVocab = () => {
    setLoading(true);
    fetch(`/api/dictionary/search?q=${encodeURIComponent(searchTerm)}&article=${selectedArticle}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVocabItems(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSave = async (item: any) => {
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedWord: item.germanWord,
          baseWord: item.baseForm || item.germanWord,
          article: item.article,
          pluralForm: item.pluralForm,
          meaningAr: item.meaningAr,
          meaningEn: item.meaningEn || item.germanWord,
          wordType: item.wordType,
          pdfPageRef: item.pdfPageRef,
        }),
      });
      if (res.ok) {
        setSavedIds((prev) => ({ ...prev, [item.id]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const articleBadges: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 border-blue-200",
    die: "bg-red-100 text-red-800 border-red-200",
    das: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center space-x-2">
          <BookA className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Master Lexicon (قاموس الكلمات الشامل)
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Alle Vokabeln aus dem Lehrbuch und dem alphabetischen Gesamtwörterbuch mit Artikeln, Pluralformen und deutscher Aussprache.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Suchbegriff eingeben (z.B. Arzt, Termin, fahren)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchVocab()}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Artikel:</span>
          {["all", "der", "die", "das"].map((art) => (
            <button
              key={art}
              onClick={() => setSelectedArticle(art)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                selectedArticle === art
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {art === "all" ? "Alle" : art}
            </button>
          ))}
          <button
            onClick={fetchVocab}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Suchen
          </button>
        </div>
      </div>

      {/* Lexicon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vocabItems.map((item) => {
          const isSaved = savedIds[item.id];
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
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
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {item.germanWord}
                    </h3>
                  </div>

                  <AudioPlayerButton
                    text={item.germanWord}
                    playbackSpeed={playbackSpeed}
                    size="sm"
                  />
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-base font-arabic font-semibold text-slate-800 dark:text-slate-200">
                    {item.meaningAr || "انظر الشرح في الدرس"}
                  </p>
                  {item.pluralForm && (
                    <p className="text-xs text-slate-500">
                      Plural: <span className="font-medium">{item.germanWord} (..{item.pluralForm})</span>
                    </p>
                  )}
                  {item.exampleSentence && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg mt-2">
                      "{item.exampleSentence}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">PDF Seite {item.pdfPageRef}</span>
                <button
                  onClick={() => handleSave(item)}
                  disabled={isSaved}
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    isSaved
                      ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                      : "text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
