"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { tagColor } from "@/lib/crm";

// Tags prédéfinis cliquables (1 clic pour ajouter/retirer, multi-sélection).
const SUGGESTED = [
  "Intéressé",
  "À relancer",
  "Pas intéressé",
  "Décideur absent",
  "Barrage secrétaire",
  "Messagerie",
  "Rappeler plus tard",
  "Demande infos",
  "Concurrent en place",
  "RDV potentiel",
  "Injoignable",
  "Chaud",
];

// Composant contrôlé : la liste des tags est pilotée par le parent (value/onChange),
// pour pouvoir être conservée hors du composant (brouillon persistant).
export default function TagInput({
  value,
  onChange,
  name = "tags",
  placeholder = "Autre tag…",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  name?: string;
  placeholder?: string;
}) {
  const tags = value;
  const [draft, setDraft] = useState("");

  // Refs pour committer un tag à moitié tapé au démontage (ex : minimisation de la fiche).
  const draftRef = useRef("");
  draftRef.current = draft;
  const tagsRef = useRef(value);
  tagsRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function toggle(t: string) {
    onChange(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);
  }
  function add(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft("");
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  useEffect(
    () => () => {
      const d = draftRef.current.trim();
      if (!d) return;
      const parts = d.split(",").map((s) => s.trim()).filter(Boolean);
      const next = [...tagsRef.current];
      for (const p of parts) if (!next.includes(p)) next.push(p);
      if (next.length !== tagsRef.current.length) onChangeRef.current(next);
    },
    []
  );

  const custom = tags.filter((t) => !SUGGESTED.includes(t));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED.map((t) => {
          const on = tags.includes(t);
          const c = tagColor(t);
          return (
            <button
              type="button"
              key={t}
              onClick={() => toggle(t)}
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors"
              style={
                on
                  ? { background: c.bg, color: c.text, border: "1px solid " + c.bg }
                  : { background: "#fff", color: "#6B7280", border: "1px solid #E3E8F0" }
              }
            >
              {t}
            </button>
          );
        })}
      </div>

      {custom.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {custom.map((t) => {
            const c = tagColor(t);
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: c.bg, color: c.text }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  className="opacity-70 hover:opacity-100"
                  aria-label={"Retirer " + t}
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) add(v);
          else setDraft(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <input type="hidden" name={name} value={tags.join(",")} />
    </div>
  );
}
