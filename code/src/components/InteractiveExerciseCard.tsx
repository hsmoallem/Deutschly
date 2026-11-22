"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lightbulb, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import AudioPlayerButton from "./AudioPlayerButton";

export interface ChoiceItem {
  id?: string;
  choiceLabel: string;
  choiceText: string;
}

export interface QuestionData {
  id: string;
  questionNumber: number;
  questionText: string;
  originalHint?: string | null;
  correctChoiceLabel: string;
  answerStatus?: string;
  isFlaggedForReview?: boolean;
  reviewReason?: string | null;
  pdfPageRef: number;
  choices: ChoiceItem[];
  userState?: {
    classification: string;
    isCompleted: boolean;
    attemptsCount: number;
  };
  savedAiHint?: string | null;
}

interface InteractiveExerciseCardProps {
  question: QuestionData;
  playbackSpeed: number;
  onAttemptSubmitted?: (result: any) => void;
}

export default function InteractiveExerciseCard({
  question,
  playbackSpeed,
  onAttemptSubmitted,
}: InteractiveExerciseCardProps) {
  const [areChoicesRevealed, setAreChoicesRevealed] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [hasListenedRevealedChoice, setHasListenedRevealedChoice] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(question.savedAiHint || null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    isCorrect: boolean;
    correctChoiceLabel: string;
    classification: string;
  } | null>(null);

  const toggleRevealChoices = () => {
    setAreChoicesRevealed(!areChoicesRevealed);
  };

  const handleRequestHint = async () => {
    setHasUsedHint(true);
    if (hintText) return;

    setIsLoadingHint(true);
    try {
      const res = await fetch("/api/hints/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      const data = await res.json();
      if (data.success) {
        setHintText(data.hint);
      }
    } catch (err) {
      console.error("Hint error:", err);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedChoice) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          submittedChoice: selectedChoice,
          usedHint: hasUsedHint,
          revealedChoices: areChoicesRevealed,
          listenedRevealedChoices: hasListenedRevealedChoice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionResult({
          isCorrect: data.isCorrect,
          correctChoiceLabel: data.correctChoiceLabel,
          classification: data.classification,
        });
        if (onAttemptSubmitted) {
          onAttemptSubmitted(data);
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const classificationBadges: Record<string, { label: string; class: string }> = {
    SOLVED_INDEPENDENTLY: {
      label: "Solved Independently",
      class: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    DIFFICULT: {
      label: "Needed Help (Difficult)",
      class: "bg-amber-100 text-amber-800 border-amber-200",
    },
    WRONG: {
      label: "Incorrect Answer (Wrong)",
      class: "bg-rose-100 text-rose-800 border-rose-200",
    },
    PENDING: {
      label: "Not Answered",
      class: "bg-slate-100 text-slate-600 border-slate-200",
    },
  };

  const currentClassification =
    submissionResult?.classification ||
    question.userState?.classification ||
    "PENDING";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-sm border border-brand-200 dark:border-brand-900">
            {question.questionNumber}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Seite (PDF p. {question.pdfPageRef})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {question.isFlaggedForReview && (
            <span
              title={question.reviewReason || "Flagged for manual review"}
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Review Needed</span>
            </span>
          )}

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              classificationBadges[currentClassification]?.class ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            {classificationBadges[currentClassification]?.label}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="flex items-start justify-between space-x-3 mb-6">
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
          {question.questionText}
        </p>
        <AudioPlayerButton
          text={question.questionText}
          playbackSpeed={playbackSpeed}
          size="md"
        />
      </div>

      {/* Controls: Hide/Reveal & Hint */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={toggleRevealChoices}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            areChoicesRevealed
              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200"
              : "bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-950/50 dark:text-brand-300"
          }`}
        >
          {areChoicesRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide Answer Choices</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Reveal Answer Choices</span>
            </>
          )}
        </button>

        <button
          onClick={handleRequestHint}
          disabled={isLoadingHint}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            hasUsedHint
              ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{hasUsedHint ? "Hint Active (Counts as Help)" : "Request AI Hint"}</span>
        </button>
      </div>

      {/* AI Hint Box */}
      {hintText && (
        <div className="mb-4 p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">AI Hint (مساعدة ذكية):</span>
            <p>{hintText}</p>
          </div>
        </div>
      )}

      {/* Answer Choices */}
      {areChoicesRevealed ? (
        <div className="space-y-2.5 mb-6">
          {question.choices.map((choice) => {
            const isSelected = selectedChoice === choice.choiceLabel;
            const isCorrectAnswer =
              submissionResult?.correctChoiceLabel === choice.choiceLabel;
            const isWrongSelection =
              submissionResult && isSelected && !submissionResult.isCorrect;

            let choiceClasses =
              "border-slate-200 dark:border-slate-700 hover:border-brand-400 bg-slate-50/60 dark:bg-slate-800/40";

            if (isSelected) {
              choiceClasses =
                "border-brand-600 bg-brand-50/80 text-brand-900 dark:border-brand-500 dark:bg-brand-950/50";
            }
            if (submissionResult) {
              if (isCorrectAnswer) {
                choiceClasses =
                  "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500";
              } else if (isWrongSelection) {
                choiceClasses =
                  "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:border-rose-500";
              }
            }

            return (
              <div
                key={choice.choiceLabel}
                onClick={() => setSelectedChoice(choice.choiceLabel)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${choiceClasses}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 font-bold text-xs uppercase flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs">
                    {choice.choiceLabel}
                  </span>
                  <span className="text-sm font-medium">{choice.choiceText}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Choice audio only visible when choices revealed */}
                  <AudioPlayerButton
                    text={choice.choiceText}
                    playbackSpeed={playbackSpeed}
                    size="sm"
                    onPlayStarted={() => setHasListenedRevealedChoice(true)}
                  />

                  {submissionResult && isCorrectAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {isWrongSelection && (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hidden-choice-container p-6 mb-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Answer choices are currently hidden to challenge yourself.
          </p>
          <button
            onClick={toggleRevealChoices}
            className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Click "Reveal Answer Choices" to inspect options and listen to choices.
          </button>
        </div>
      )}

      {/* Submission Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-400">
          Versuche (Attempts): {question.userState?.attemptsCount || 0}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedChoice || isSubmitting}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
            !selectedChoice || isSubmitting
              ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
              : "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-98"
          }`}
        >
          {isSubmitting ? "Checking..." : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}
