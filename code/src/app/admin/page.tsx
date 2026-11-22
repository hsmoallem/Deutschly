"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Save,
  Clock,
  Eye,
} from "lucide-react";
import AudioPlayerButton from "@/components/AudioPlayerButton";

import { useAudio } from "@/context/AudioContext";

export default function AdminVerificationPage() {
  const { playbackSpeed } = useAudio();
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<string>("all"); // "all", "flagged", "user_provided"
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editChoiceLabel, setEditChoiceLabel] = useState<string>("");
  const [editReason, setEditReason] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Selected question for side-by-side inspection
  const [selectedForInspection, setSelectedForInspection] = useState<any | null>(null);

  const fetchQuestions = () => {
    setLoading(true);
    fetch(`/api/admin/questions?filter=${filter}&page=${page}&limit=10`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuestions(data.questions);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          if (data.questions.length > 0 && !selectedForInspection) {
            setSelectedForInspection(data.questions[0]);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, [filter, page]);

  const handleSaveCorrection = async (questionId: string) => {
    if (!editChoiceLabel) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          newCorrectChoiceLabel: editChoiceLabel,
          reason: editReason || "Admin manual verification",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingQId(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Content Verification & Answer Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Überprüfe die extrahierten Fragen mit der Original-PDF-Seite nebeneinander. Passe Antworten an (werden als "USER_PROVIDED" gespeichert).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === "all"
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            Alle ({total})
          </button>
          <button
            onClick={() => {
              setFilter("flagged");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === "flagged"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-white text-orange-700 border-orange-200 dark:bg-slate-800 dark:text-orange-300 dark:border-slate-700"
            }`}
          >
            Review Needed (Flagged)
          </button>
          <button
            onClick={() => {
              setFilter("user_provided");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filter === "user_provided"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-indigo-700 border-indigo-200 dark:bg-slate-800 dark:text-indigo-300 dark:border-slate-700"
            }`}
          >
            User Provided
          </button>
        </div>
      </div>

      {/* Main Split View: Questions List & Side-by-Side Original PDF Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Questions List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {questions.map((q) => {
            const isEditing = editingQId === q.id;
            const isSelected = selectedForInspection?.id === q.id;

            return (
              <div
                key={q.id}
                onClick={() => setSelectedForInspection(q)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-brand-500 bg-brand-50/20 shadow-md ring-2 ring-brand-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {q.lessonNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      Q#{q.number} &bull; PDF p. {q.pdfPageRef}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {q.isFlaggedForReview && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        Review Needed
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        q.answerStatus === "USER_PROVIDED"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {q.answerStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between space-x-2 mb-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {q.text}
                  </p>
                  <AudioPlayerButton text={q.text} size="sm" />
                </div>

                {/* Choices Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {q.choices.map((c: any) => {
                    const isCorrect = q.correctChoiceLabel.toLowerCase() === c.label.toLowerCase();
                    return (
                      <div
                        key={c.label}
                        className={`p-2 rounded-lg border flex items-center justify-between ${
                          isCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200 font-bold"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border">
                            {c.label}
                          </span>
                          <span className="truncate">{c.text}</span>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Edit Answer Section */}
                {isEditing ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Set Correct Answer:
                      </span>
                      {["a", "b", "c", "d"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setEditChoiceLabel(opt)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold uppercase transition-colors ${
                            editChoiceLabel === opt
                              ? "bg-brand-600 text-white"
                              : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Optional reason for change..."
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    />
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setEditingQId(null)}
                        className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveCorrection(q.id)}
                        disabled={isSaving}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as USER_PROVIDED</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Correct Answer: <strong className="text-slate-900 dark:text-white uppercase">{q.correctChoiceLabel}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingQId(q.id);
                        setEditChoiceLabel(q.correctChoiceLabel);
                        setEditReason("");
                      }}
                      className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Answer</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} ({total} questions)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Side-by-Side Original PDF Page Image (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-brand-600" />
                <span>Original PDF Page (Scan Inspection)</span>
              </h3>
              {selectedForInspection && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                  Seite {selectedForInspection.pdfPageRef}
                </span>
              )}
            </div>

            {selectedForInspection ? (
              <div className="space-y-3">
                <div className="max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
                  <img
                    src={selectedForInspection.pageImageUrl}
                    alt={`Original PDF Page ${selectedForInspection.pdfPageRef}`}
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Inspecting Question #{selectedForInspection.number}:
                  </div>
                  <p className="truncate italic">"{selectedForInspection.text}"</p>
                  {selectedForInspection.isFlaggedForReview && (
                    <div className="text-orange-700 dark:text-orange-300 font-medium pt-1">
                      Flag Reason: {selectedForInspection.reviewReason}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select a question on the left to inspect its original scanned PDF page side-by-side.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
