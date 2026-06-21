"use client";

import { Mic } from "lucide-react";
import type { Call } from "@/lib/crm";
import { outcomeLabel, interetMeta } from "@/lib/crm";
import Tag from "./Tag";
import { useFiche } from "./FicheModal";

export type JournalItem = {
  call: Call;
  prospectId: string;
  nom: string;
  ville: string | null;
  interet: string | null;
  count: number;
};

export type JournalGroup = { day: string; items: JournalItem[] };

export default function JournalList({ groups }: { groups: JournalGroup[] }) {
  const { open } = useFiche();

  return (
    <div className="space-y-7">
      {groups.map((g) => (
        <div key={g.day}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-mut">{g.day}</h2>
          <div className="space-y-2.5">
            {g.items.map(({ call: c, prospectId, nom, ville, interet, count }) => {
              const im = interetMeta(interet);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => open(prospectId)}
                  className="block w-full rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-ink"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: im?.color ?? "#cbd5e1" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{nom}</span>
                    <span className="shrink-0 rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium text-mut">
                      {outcomeLabel(c.outcome)}
                    </span>
                  </div>
                  {c.notes && (
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[13px] text-ink/75">{c.notes}</p>
                  )}
                  {c.tags && c.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <Tag key={t} label={t} hash />
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-mut">
                    {c.recording_path && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <Mic size={13} /> audio
                      </span>
                    )}
                    {ville && <span>{ville}</span>}
                    <span>· {count} appel{count > 1 ? "s" : ""}</span>
                    {c.rappel_at && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                        Rappel {new Date(c.rappel_at).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
