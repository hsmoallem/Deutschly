"use client";

import React from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DoubleClickWordModal from "@/components/DoubleClickWordModal";
import { AudioProvider, useAudio } from "@/context/AudioContext";

function MainContent({ children }: { children: React.ReactNode }) {
  const { playbackSpeed, setPlaybackSpeed, user } = useAudio();

  return (
    <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <Navbar
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        user={user}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          Deutschly &bull; Interactive German Learning Platform &bull; Content Source: منهج اللغة الألمانية للصف الثالث الثانوي
        </p>
      </footer>

      {/* Global Double-Click Vocabulary Lookup */}
      <DoubleClickWordModal />
    </body>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <AudioProvider>
        <MainContent>{children}</MainContent>
      </AudioProvider>
    </html>
  );
}
