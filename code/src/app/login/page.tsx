"use client";

import React, { useState } from "react";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("student");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login fehlgeschlagen");
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/30">
            D
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Anmelden bei Deutschly
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Melde dich an, um deinen Lernfortschritt geräteübergreifend zu synchronisieren.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Benutzername (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Passwort
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Wird angemeldet..." : "Anmelden"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Standard-Zugangsdaten zum Testen:
          </p>
          <p>Anmeldung: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">student</code> / <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">password123</code></p>
        </div>
      </div>
    </div>
  );
}
