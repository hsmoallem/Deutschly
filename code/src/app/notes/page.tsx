"use client";

import React, { useState, useEffect } from "react";
import { StickyNote, Plus, Star, Trash2, Sparkles, Check } from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Grammatik");

  const fetchNotes = () => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotes(data.notes);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setIsCreating(false);
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <StickyNote className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              My Tips & Notes (ملاحظاتي وقواعدي الخاصة)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deine persönliche Wissensdatenbank für Grammatikregeln, Eselsbrücken und Vokabelnotizen.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Notiz verfassen</span>
        </button>
      </div>

      {/* Creation Modal / Form */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-4"
        >
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Notiz hinzufügen
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Titel
              </label>
              <input
                type="text"
                placeholder="z.B. Verben für elektrische Geräte (anmachen/ausmachen)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Grammatik">Grammatik</option>
                <option value="Wortschatz">Wortschatz</option>
                <option value="Alltagssituationen">Alltagssituationen</option>
                <option value="Prüfungstipp">Prüfungstipp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Inhalt / Erklärung
            </label>
            <textarea
              rows={3}
              placeholder="Schreibe deinen Merksatz oder deine Erklärung auf..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-xs"
            >
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {note.category}
                </span>

                {note.isAiGenerated && (
                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>AI Generated</span>
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                {note.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400">
                {new Date(note.createdAt).toLocaleDateString("de-DE")}
              </span>
              <button
                onClick={() => handleDelete(note.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                title="Notiz löschen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {notes.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <StickyNote className="w-10 h-10 text-brand-600 mx-auto mb-2 opacity-60" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Noch keine persönlichen Notizen vorhanden
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nutze den Button "Neue Notiz verfassen", um deine eigenen Grammatiktipps und Merksätze zu sichern.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
