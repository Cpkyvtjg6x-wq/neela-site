"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/crm";
import { STATUTS, interetMeta, prospectScore, scoreTier } from "@/lib/crm";
import { updateProspect } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";

// Colonnes = étapes actives du pipeline. Les statuts terminaux (pas intéressé / perdu)
// passent en zones de dépôt en bas pour ne pas surcharger la largeur.
const TERMINAL_KEYS = ["pas_interesse", "perdu"];
const STAGES = STATUTS.filter((s) => !TERMINAL_KEYS.includes(s.key));
const TERMINAL = STATUTS.filter((s) => TERMINAL_KEYS.includes(s.key));

export default function Pipeline({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const { open } = useFiche();
  const [, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const statutOf = (p: Prospect) => overrides[p.id] ?? p.statut;

  function move(id: string, statut: string) {
    const p = prospects.find((x) => x.id === id);
    if (!p || statutOf(p) === statut) return;
    setOverrides((o) => ({ ...o, [id]: statut }));
    const fd = new FormData();
    fd.set("id", id);
    fd.set("statut", statut);
    start(async () => {
      try {
        await updateProspect(fd);
        router.refresh();
      } catch {
        setOverrides((o) => { const n = { ...o }; delete n[id]; return n; });
      }
    });
  }

  function Card({ p }: { p: Prospect }) {
    const im = interetMeta(p.interet);
    const sc = prospectScore(p);
    const tier = scoreTier(sc);
    return (
      <div
        draggable
        onDragStart={() => setDragId(p.id)}
        onDragEnd={() => { setDragId(null); setOverKey(null); }}
        onClick={() => open(p.id, p)}
        className={`cursor-grab rounded-lg border border-line bg-white p-2.5 transition-shadow hover:shadow-md active:cursor-grabbing ${dragId === p.id ? "opacity-50" : ""}`}
      >
        <div className="flex items-start justify-between gap-1.5">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight">{p.nom}</p>
          <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: tier.color }}>{sc}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {im && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: im.color }} title={im.label} />}
          <p className="min-w-0 flex-1 truncate text-[11px] text-mut">{p.ville || "—"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Étapes actives — grille responsive, sans défilement horizontal */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => {
          const items = prospects.filter((p) => statutOf(p) === s.key).sort((a, b) => prospectScore(b) - prospectScore(a));
          return (
            <div
              key={s.key}
              onDragOver={(e) => { e.preventDefault(); setOverKey(s.key); }}
              onDragLeave={() => setOverKey((c) => (c === s.key ? null : c))}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, s.key); setDragId(null); setOverKey(null); }}
              className={`rounded-2xl border p-2 transition-colors ${overKey === s.key ? "border-accent bg-accent/5" : "border-line bg-paper"}`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="truncate text-[12.5px] font-bold">{s.label}</span>
                <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-mut">{items.length}</span>
              </div>
              <div className="max-h-[58vh] space-y-1.5 overflow-y-auto pr-0.5">
                {items.map((p) => <Card key={p.id} p={p} />)}
                {items.length === 0 && <p className="py-3 text-center text-[11px] text-mut/60">—</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Statuts terminaux — zones de dépôt */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {TERMINAL.map((s) => {
          const n = prospects.filter((p) => statutOf(p) === s.key).length;
          return (
            <div
              key={s.key}
              onDragOver={(e) => { e.preventDefault(); setOverKey(s.key); }}
              onDragLeave={() => setOverKey((c) => (c === s.key ? null : c))}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, s.key); setDragId(null); setOverKey(null); }}
              className={`rounded-2xl border border-dashed py-3 text-center text-sm font-semibold transition-colors ${overKey === s.key ? "border-red-300 bg-red-50 text-red-700" : "border-line text-mut"}`}
            >
              {s.label} <span className="text-xs font-normal">({n})</span>
              {dragId && <span className="ml-1 text-[11px] font-normal">— déposer ici</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
