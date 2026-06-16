"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { tagColor } from "@/lib/crm";

export default function TagInput({
  name = "tags",
  defaultValue = [],
  placeholder = "Ajouter un tag puis Entrée…",
}: {
  name?: string;
  defaultValue?: string[];
  placeholder?: string;
}) {
  const [tags, setTags] = useState<string[]>(
    defaultValue.filter(Boolean)
  );
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
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

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2 focus-within:border-accent">
      {tags.map((t) => {
        const c = tagColor(t);
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
            style={{ background: c.bg, color: c.text }}
          >
            {t}
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
              className="opacity-70 hover:opacity-100"
              aria-label={`Retirer ${t}`}
            >
              <X size={12} />
            </button>
          </span>
        );
      })}
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(",")) add(v);
          else setDraft(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
      />
      {/* valeur transmise au formulaire (séparée par des virgules) */}
      <input type="hidden" name={name} value={tags.join(",")} />
    </div>
  );
}
