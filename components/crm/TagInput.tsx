"use client";

import { useState } from "react";
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

export default function TagInput({
  name = "tags",
  defaultValue = [],
  placeholder = "Autre tag…",
}: {
  name?: string;
  defaultValue?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(defaultValue.filter(Boolean));
  const [draft, setDraft] = useState("");

  function toggle(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }
  function add(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) if (!next.includes(p)) next.push(p);
      return next;
    });
    setDraft("");
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

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
