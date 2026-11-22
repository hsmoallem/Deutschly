"use client";

import React, { useState, useEffect } from "react";
import Link from "next/router";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  CheckSquare,
  HelpCircle,
  AlertTriangle,
  Languages,
  BookA,
  StickyNote,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  Sliders,
} from "lucide-react";

interface NavbarProps {
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  user: any;
}

export default function Navbar({ playbackSpeed, onSpeedChange, user }: NavbarProps) {
  const pathname = usePathname();
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/lessons", label: "Lessons", icon: BookOpen },
    { href: "/difficult", label: "Difficult Questions", icon: HelpCircle },
    { href: "/wrong", label: "Wrong Answers", icon: AlertTriangle },
    { href: "/vocabulary", label: "Vocabulary Review", icon: Languages },
    { href: "/dictionary", label: "Master Lexicon", icon: BookA },
    { href: "/notes", label: "My Tips & Notes", icon: StickyNote },
    { href: "/admin", label: "Verification / Admin", icon: ShieldCheck },
  ];

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-500/30">
                D
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Deutschly
              </span>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Audio Speed & User */}
          <div className="flex items-center space-x-3">
            {/* Audio Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                title="German Audio Playback Speed"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {speedMenuOpen && (
                <div className="absolute right-0 mt-2 w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 z-50">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Audio Speed
                  </div>
                  {speedOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onSpeedChange(s);
                        setSpeedMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                        playbackSpeed === s
                          ? "bg-brand-50 text-brand-700 font-bold dark:bg-brand-950 dark:text-brand-300"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {s.toFixed(2)}x {s === 1.0 ? "(Normal)" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User status */}
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline-block">
                  {user.username}
                </span>
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  title="Logout"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
