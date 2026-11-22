"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, BookmarkPlus, Check, X, Volume2 } from "lucide-react";
import AudioPlayerButton from "./AudioPlayerButton";

export interface WordLookupResult {
  originalWord: string;
  lemma: string;
  article: string | null;
  pluralForm: string | null;
  meaningAr: string | null;
  meaningEn: string | null;
  wordType: string | null;
  exampleSentence?: string | null;
}

export default function DoubleClickWordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState("");
  const [lookupData, setLookupData] = useState<WordLookupResult | null>(null);
  const [activeTab, setActiveTab] = useState<"meaning" | "article">("meaning");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const handleDoubleClick = async (e: MouseEvent) => {
      // Check if target is inside hidden choices container
      const target = e.target as HTMLElement;
      if (target.closest(".hidden-choice-container")) {
        // Disallow dictionary lookup on hidden choices!
        return;
      }

      const selection = window.getSelection();
      const rawText = selection?.toString().trim();

      if (!rawText || rawText.length < 2 || rawText.length > 35) return;
      // Filter out numbers or non-German tokens
      if (!/^[A-Za-zÄÖÜäöüß\-]+$/.test(rawText)) return;

      setSelectedWord(rawText);
      setIsSaved(false);
      setIsLoading(true);
      setIsOpen(true);

      try {
        const res = await fetch(`/api/dictionary/lookup?word=${encodeURIComponent(rawText)}`);
        const data = await res.json();
        if (data.success) {
          setLookupData(data.lookup);
        }
      } catch (err) {
        console.error("Lookup failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener("dblclick", handleDoubleClick);
    return () => window.removeEventListener("dblclick", handleDoubleClick);
  }, []);

  const handleSaveToVocab = async () => {
    if (!lookupData) return;
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedWord,
          baseWord: lookupData.lemma || selectedWord,
          article: lookupData.article,
          pluralForm: lookupData.pluralForm,
          meaningEn: lookupData.meaningEn || selectedWord,
          meaningAr: lookupData.meaningAr || "انظر القاموس",
          wordType: lookupData.wordType,
        }),
      });
      if (res.ok) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Save vocabulary error:", err);
    }
  };

  if (!isOpen) return null;

  const articleColors: Record<string, string> = {
    der: "bg-blue-100 text-blue-800 border-blue-300",
    die: "bg-red-100 text-red-800 border-red-300",
    das: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Wörterbuch (Dictionary Lookup)
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedWord}
                </span>
                <AudioPlayerButton text={selectedWord} size="sm" />
              </div>
              {lookupData?.lemma && lookupData.lemma.toLowerCase() !== selectedWord.toLowerCase() && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Grundform (Lemma): <span className="font-medium">{lookupData.lemma}</span>
                </div>
              )}
            </div>

            {lookupData?.article && (
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                  articleColors[lookupData.article.toLowerCase()] ||
                  "bg-slate-100 text-slate-700"
                }`}
              >
                {lookupData.article.toUpperCase()}
              </span>
            )}
          </div>

          {/* Option Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
            <button
              onClick={() => setActiveTab("meaning")}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "meaning"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Option A: Meaning (المعنى)
            </button>
            <button
              onClick={() => setActiveTab("article")}
              className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "article"
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Option B: German Article (الأداة والجمع)
            </button>
          </div>

          {/* Tab 1: Meaning */}
          {activeTab === "meaning" && (
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Arabic Definition:</span>
                <p className="text-lg font-arabic font-semibold text-slate-800 dark:text-slate-100 mt-1">
                  {lookupData?.meaningAr || "الكلمة متوفرة في القاموس المدرسي"}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">Word Type:</span>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                  {lookupData?.wordType || "Substantiv / Wort"}
                </p>
              </div>
              {lookupData?.exampleSentence && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold block mb-1">Beispiel (Example):</span>
                  "{lookupData.exampleSentence}"
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Article & Grammar */}
          {activeTab === "article" && (
            <div className="space-y-3">
              {lookupData?.article ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bestimmter Artikel:
                    </span>
                    <span className="text-base font-bold text-brand-600">
                      {lookupData.article}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Singular / Plural:
                    </span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {lookupData.lemma} {lookupData.pluralForm ? `(Pl. ..${lookupData.pluralForm})` : ""}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 text-center">
                  Für dieses Wort gilt kein grammatischer Artikel (z.B. Verb, Adjektiv oder Partikel).
                </div>
              )}
            </div>
          )}

          {/* Footer action */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              onClick={handleSaveToVocab}
              disabled={isSaved}
              className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isSaved
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/20"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved in Vocabulary</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  <span>Save to Vocabulary Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
