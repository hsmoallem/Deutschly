"use client";

import React, { useState, useEffect } from "react";
import {
  Languages,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Volume2,
  Search,
  Filter,
  Sparkles,
  BookMarked,
  Layers,
} from "lucide-react";
import AudioPlayerButton from "@/components/AudioPlayerButton";
import { useAudio } from "@/context/AudioContext";

export default function MasterVocabularyPage() {
  const { playbackSpeed } = useAudio();
  
  // Primary View Mode
  const [viewMode, setViewMode] = useState<"lessons" | "dictionary" | "saved">("lessons");

  // Lessons list for filter
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data states
  const [vocabularyItems, setVocabularyItems] = useState<any[]>([]);
  const [savedVocabulary, setSavedVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedStatusFilter, setSavedStatusFilter] = useState<string>("all");

  // Fetch Lessons
  useEffect(() => {
    fetch("/api/lessons")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLessons(data.lessons.filter((l: any) => l.lessonNumber.startsWith("Lektion")));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Fetch Vocabulary data based on view
  const fetchVocabulary = () => {
    setLoading(true);
    if (viewMode === "saved") {
      fetch("/api/vocabulary?type=saved")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setSavedVocabulary(data.vocabulary || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else if (viewMode === "dictionary") {
      fetch("/api/dictionary/search?q=")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setVocabularyItems(data.items || []);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      // Master lesson vocabulary
      const params = new URLSearchParams();
      if (selectedLessonId !== "all") params.append("lessonId", selectedLessonId);
      if (selectedArticle !== "all") params.append("article", selectedArticle);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      fetch(`/api/vocabulary?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Exclude general dictionary in the "lessons" view
            const lessonWords = data.vocabulary.filter(
              (item: any) => item.lesson?.lessonNumber?.startsWith("Lektion")
            );
            setVocabularyItems(lessonWords);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchVocabulary();
  }, [viewMode, selectedLessonId, selectedArticle, searchQuery]);

  // Handle saving a word to personal vocabulary
  const handleSaveWord = async (item: any) => {
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
          wordType: item.wordType,
          sentenceContext: item.exampleSentence,
          pdfPageRef: item.pdfPageRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`"${item.germanWord}" wurde zu deinen gespeicherten Vokabeln hinzugefügt!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/vocabulary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setSavedVocabulary((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const articleBadges: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    die: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    das: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  };

  // Filter dictionary items locally for quick response
  const filteredDictItems = (vocabularyItems || []).filter((item: any) => {
    if (viewMode !== "dictionary") return true;
    if (selectedArticle !== "all" && item.article?.toLowerCase() !== selectedArticle.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const de = item.germanWord?.toLowerCase() || "";
      const ar = item.meaningAr?.toLowerCase() || "";
      return de.includes(q) || ar.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Languages className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Vokabel-Zentrum (مفردات وقاموس المنهج)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            1.840 مفردة موثقة مع أداة التعريف (der, die, das)، صيغة الجمع، المعنى العربي الدقيق، ونطق ألماني بصوت نقي.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setViewMode("lessons");
              setSearchQuery("");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "lessons"
                ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-600" />
            <span>مفردات الدروس (10-14)</span>
          </button>

          <button
            onClick={() => {
              setViewMode("dictionary");
              setSearchQuery("");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "dictionary"
                ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>قاموس الكلمات (139-147)</span>
          </button>

          <button
            onClick={() => {
              setViewMode("saved");
              setSearchQuery("");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === "saved"
                ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>مفرداتي المحفوظة ({savedVocabulary.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTROLS (SEARCH & FILTERS) FOR LESSONS & DICTIONARY                      */}
      {/* ========================================================================= */}
      {viewMode !== "saved" && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Suche auf Deutsch oder Arabisch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Lesson Selector (only for Lessons view) */}
            {viewMode === "lessons" && (
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="all">Alle Lektionen (10 - 14)</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lessonNumber}: {l.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Article Badges Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Artikel:</span>
            {["all", "der", "das", "die"].map((art) => (
              <button
                key={art}
                onClick={() => setSelectedArticle(art)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                  selectedArticle === art
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {art}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: LEKTIONSWORTSCHATZ (LESSON VOCABULARY)                            */}
      {/* ========================================================================= */}
      {viewMode === "lessons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Gefundene Vokabeln: <strong>{vocabularyItems.length}</strong></span>
            <span>Klicke auf das Lesezeichen, um ein Wort für spätere Wiederholung zu speichern.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vocabularyItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all group"
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

                    <div className="flex items-center space-x-1">
                      <AudioPlayerButton text={item.germanWord} playbackSpeed={playbackSpeed} size="sm" />
                      <button
                        onClick={() => handleSaveWord(item)}
                        title="Zu Vokabeln speichern"
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                  <span className="font-medium text-brand-600 dark:text-brand-400">
                    {item.lesson?.lessonNumber} &bull; S. {item.pdfPageRef}
                  </span>
                  <span className="capitalize">{item.wordType}</span>
                </div>
              </div>
            ))}

            {vocabularyItems.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                <Languages className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <h3 className="font-bold text-slate-900 dark:text-white">Keine Vokabeln gefunden</h3>
                <p className="text-xs text-slate-500 mt-1">Ändere den Filter oder Suchbegriff.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GENERAL DICTIONARY (SEITEN 139 BIS 147)                           */}
      {/* ========================================================================= */}
      {viewMode === "dictionary" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-start space-x-3">
            <Layers className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                قاموس الكلمات العام (الصفحات 139 إلى 147)
              </h2>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                قاموس ألماني-عربي شامل لجميع مفردات المرحلة الثانوية مرتبة ومفهرسة مع النطق الصوتي الفوري.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDictItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
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

                    <div className="flex items-center space-x-1">
                      <AudioPlayerButton text={item.germanWord} playbackSpeed={playbackSpeed} size="sm" />
                      <button
                        onClick={() => handleSaveWord(item)}
                        title="Zu Vokabeln speichern"
                        className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-2">
                    <p className="text-base font-arabic font-bold text-slate-800 dark:text-slate-100 text-right">
                      {item.meaningAr}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>قاموس الكلمات &bull; Seite {item.pdfPageRef}</span>
                  <span className="capitalize">{item.wordType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SAVED VOCABULARY (MY VOCABULARY)                                  */}
      {/* ========================================================================= */}
      {viewMode === "saved" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Deine gespeicherten Vokabeln ({savedVocabulary.length})
            </h2>

            <div className="flex items-center space-x-2">
              {["all", "learning", "difficult", "learned"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSavedStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border capitalize transition-colors ${
                    savedStatusFilter === st
                      ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedVocabulary
              .filter((item: any) =>
                savedStatusFilter === "all" ? true : item.status === savedStatusFilter
              )
              .map((item: any) => (
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
                      <p className="text-base font-arabic font-semibold text-slate-800 dark:text-slate-200 text-right">
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
                      {item.sentenceContext && (
                        <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                          "{item.sentenceContext}"
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
                          <span>Gelernt</span>
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

            {savedVocabulary.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                <Bookmark className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-60" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Noch keine Vokabeln gespeichert
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Speichere Vokabeln mit dem Lesezeichen-Symbol oder klicke doppelt auf ein beliebiges Wort beim Lernen.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
