"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

// Global audio reference to ensure only one clip plays at a time
let currentActiveAudio: HTMLAudioElement | null = null;
let currentStopCallback: (() => void) | null = null;

interface AudioPlayerButtonProps {
  text: string;
  playbackSpeed?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  onPlayStarted?: () => void;
}

export default function AudioPlayerButton({
  text,
  playbackSpeed = 1.0,
  className = "",
  size = "md",
  onPlayStarted,
}: AudioPlayerButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (currentStopCallback) {
        currentStopCallback = null;
      }
    };
  }, []);

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      if (currentActiveAudio) {
        currentActiveAudio.pause();
        currentActiveAudio.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    // Stop any previously playing audio
    if (currentStopCallback) {
      currentStopCallback();
    }
    if (currentActiveAudio) {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio = null;
    }

    setIsLoading(true);
    if (onPlayStarted) {
      onPlayStarted();
    }

    try {
      const audioUrl = `/api/audio?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = playbackSpeed;

      currentActiveAudio = audio;
      currentStopCallback = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      audio.oncanplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        audio.play().catch((err) => {
          console.warn("Audio play error, falling back to speech synthesis:", err);
          fallbackSpeechSynthesis();
        });
      };

      audio.onended = () => {
        setIsPlaying(false);
        currentActiveAudio = null;
        currentStopCallback = null;
      };

      audio.onerror = () => {
        console.warn("Server audio error, using speech synthesis fallback");
        fallbackSpeechSynthesis();
      };

      // Load audio
      audio.load();
    } catch (err) {
      fallbackSpeechSynthesis();
    }
  };

  const fallbackSpeechSynthesis = () => {
    setIsLoading(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = playbackSpeed;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        currentStopCallback = null;
      };
      utterance.onerror = () => setIsPlaying(false);

      currentStopCallback = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  const sizeClasses = {
    sm: "p-1 text-xs",
    md: "p-1.5 text-sm",
    lg: "p-2 text-base",
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      title={isPlaying ? "Stop audio" : "Listen to German pronunciation"}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        isPlaying
          ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-slate-800 dark:text-brand-400 dark:hover:bg-slate-700"
      } ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4 text-amber-600 animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}
