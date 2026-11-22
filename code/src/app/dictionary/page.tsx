"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookA,
  Search,
  Filter,
  BookmarkPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import AudioPlayerButton from "@/components/AudioPlayerButton";
import { useAudio } from "@/context/AudioContext";

interface VocabItem {
  id: string;
  germanWord: string;
  baseForm?: string | null;
  article?: string | null;
  pluralForm?: string | null;
  meaningAr?: string | null;
  meaningEn?: string | null;
  wordType?: string | null;
  exampleSentence?: string | null;
  pdfPageRef?: number | null;
  lesson?: {
    id: string;
    lessonNumber: string;
    title: string;
  } | null;
}

export default function DictionaryPage() {
  const { playbackSpeed } = useAudio();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<string>("all");
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchVocab = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: debouncedSearch,
          article: selectedArticle,
          lesson: selectedLesson,
          page: targetPage.toString(),
          limit: "60",
        });

        const res = await fetch(`/api/dictionary/search?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setVocabItems(data.items || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setPage(data.page || 1);
        }
      } catch (err) {
        console.error("Dictionary fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, selectedArticle, selectedLesson, page]
  );

  useEffect(() => {
    fetchVocab(1);
  }, [debouncedSearch, selectedArticle, selectedLesson]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      fetchVocab(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSave = async (item: VocabItem) => {
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
    der: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    die: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    das: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  };

  const lessonTabs = [
    { id: "all", label: "Alle Lektionen (الكل)", short: "Alle" },
    { id: "10", label: "Lektion 10 (الصحة والمرض)", short: "L10" },
    { id: "11", label: "Lektion 11 (المدينة والمواصلات)", short: "L11" },
    { id: "12", label: "Lektion 12 (خدمة العملاء والتصليح)", short: "L12" },
    { id: "13", label: "Lektion 13 (الملابس والتسوق)", short: "L13" },
    { id: "14", label: "Lektion 14 (الحفلات والأعياد)", short: "L14" },
    { id: "general", label: "Wörterverzeichnis (القاموس العام)", short: "القاموس" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-brand-700/10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3 text-white">
            <BookA className="w-3.5 h-3.5 text-amber-300" />
            <span>Master Lexicon &bull; قاموس الكلمات الشامل</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Wörterbuch & Vokabelschatz (1.840 Wörter)
          </h1>
          <p className="mt-2 text-brand-100 text-xs sm:text-sm leading-relaxed">
            Alle Vokabeln aus Lektion 10 bis 14 und dem alphabetischen Gesamtwörterbuch (Seiten 139–147) mit Artikeln, Pluralformen, authentischer deutscher Aussprache und verifizierten arabischen Übersetzungen.
          </p>
        </div>
      </div>

      {/* Lesson Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {lessonTabs.map((tab) => {
          const isActive = selectedLesson === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedLesson(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Article Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Suchbegriff eingeben (z.B. Arzt, Termin, fahren, طبيب)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Artikel:</span>
          {["all", "der", "die", "das"].map((art) => (
            <button
              key={art}
              onClick={() => {
                setSelectedArticle(art);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                selectedArticle === art
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {art === "all" ? "Alle" : art}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Gefunden: <strong className="text-slate-900 dark:text-white">{totalCount}</strong> Vokabeln
        </span>
        {totalPages > 1 && (
          <span>
            Seite {page} von {totalPages}
          </span>
        )}
      </div>

      {/* Lexicon Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse space-y-3"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
            </div>
          ))}
        </div>
      ) : vocabItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <BookA className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Keine Vokabeln gefunden
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Versuche einen anderen Suchbegriff oder setze die Filter zurück.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabItems.map((item) => {
            const isSaved = savedIds[item.id];
            const lessonLabel = item.lesson?.lessonNumber || (item.pdfPageRef && item.pdfPageRef >= 139 ? "Wörterbuch" : "Lektion");

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-sm"
              >
                <div>
                  {/* Top Bar: Word & Audio */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center flex-wrap gap-1.5">
                      {item.article && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${
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

                  {/* Arabic Meaning */}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-lg font-arabic font-bold text-brand-700 dark:text-brand-300 text-right dir-rtl leading-relaxed">
                      {item.meaningAr || ""}
                    </p>

                    {item.pluralForm && (
                      <p className="text-xs text-slate-500">
                        Plural: <span className="font-medium text-slate-700 dark:text-slate-300">{item.germanWord} (..{item.pluralForm})</span>
                      </p>
                    )}

                    {item.exampleSentence && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl mt-2 border border-slate-100 dark:border-slate-800">
                        "{item.exampleSentence}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Bar: Lesson & Page & Save */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
                      {lessonLabel}
                    </span>
                    {item.pdfPageRef && <span>Seite {item.pdfPageRef}</span>}
                  </span>

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
                    <span>{isSaved ? "Gemerkt" : "Merken"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Zurück</span>
          </button>

          <span className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            Seite <strong className="text-slate-900 dark:text-white">{page}</strong> von{" "}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Weiter</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
