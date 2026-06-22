"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/crm";
import { STATUTS, interetMeta, prospectScore, scoreTier } from "@/lib/crm";
import { updateProspect } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";

export default function Pipeline({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const { open } = useFiche();
  const [, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const statutOf = (p: Prospect) => overrides[p.id] ?? p.statut;

  function move(id: string, statut: string) {
    const p = prospects.find((x) => x.id === id);
    if (!p || statutOf(p) === statut) return;
    setOverrides((o) => ({ ...o, [id]: statut })); // optimiste
    const fd = new FormData();
    fd.set("id", id);
    fd.set("statut", statut);
    start(async () => {
      try {
        await updateProspect(fd);
        router.refresh();
      } catch {
        setOverrides((o) => { const n = { ...o }; delete n[id]; return n; }); // revert
      }
    });
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {STATUTS.map((s) => {
          const items = prospects
            .filter((p) => statutOf(p) === s.key)
            .sort((a, b) => prospectScore(b) - prospectScore(a));
          return (
            <div
              key={s.key}
              onDragOver={(e) => { e.preventDefault(); setOverId(s.key); }}
              onDragLeave={() => setOverId((c) => (c === s.key ? null : c))}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, s.key); setDragId(null); setOverId(null); }}
              className={`w-64 shrink-0 rounded-2xl border p-3 transition-colors ${overId === s.key ? "border-accent bg-accent/5" : "border-line bg-paper"}`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-display text-sm font-bold">{s.label}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-mut">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((p) => {
                  const im = interetMeta(p.interet);
                  const sc = prospectScore(p);
                  const tier = scoreTier(sc);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => { setDragId(null); setOverId(null); }}
                      onClick={() => open(p.id, p)}
                      className={`cursor-grab rounded-xl border border-line bg-white p-3 transition-shadow hover:shadow-md active:cursor-grabbing ${dragId === p.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{p.nom}</p>
                        <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: tier.color }}>{sc}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-mut">{[p.ville, p.departement && `(${p.departement})`].filter(Boolean).join(" ")}</p>
                      {im && <span className="mt-1.5 inline-block h-2 w-2 rounded-full" style={{ background: im.color }} title={im.label} />}
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-3 text-center text-[12px] text-mut/70">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
