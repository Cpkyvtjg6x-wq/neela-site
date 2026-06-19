"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Prospect, Call } from "@/lib/crm";
import { statutLabel, interetMeta, outcomeLabel } from "@/lib/crm";
import { getProspectDetail } from "@/app/crm/actions";
import InteractionForm from "./InteractionForm";
import Tag from "./Tag";

type Detail = { prospect: Prospect; calls: Call[]; audio: Record<string, string> };

type Ctx = { open: (id: string) => void; close: () => void };
const FicheCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const useFiche = () => useContext(FicheCtx);

export function FicheProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const open = useCallback((i: string) => setId(i), []);
  const close = useCallback(() => setId(null), []);
  return (
    <FicheCtx.Provider value={{ open, close }}>
      {children}
      {id && <FicheModal id={id} onClose={close} />}
    </FicheCtx.Provider>
  );
}

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function FicheModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProspectDetail(id).then((d) => {
      if (active) {
        setData(d as Detail | null);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  const p = data?.prospect;
  const im = p ? interetMeta(p.interet) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6">
      <div className="relative my-4 w-full max-w-3xl rounded-2xl bg-paper shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 text-mut shadow hover:text-ink"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="p-10 text-center text-sm text-mut">Chargement…</div>
        ) : !p ? (
          <div className="p-10 text-center text-sm text-mut">Prospect introuvable.</div>
        ) : (
          <div className="p-5 sm:p-6">
            {/* En-tête */}
            <div className="mb-5 pr-8">
              <div className="flex flex-wrap items-center gap-2.5">
                {im && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: im.color }}>
                    {im.label}
                  </span>
                )}
                <h2 className="font-display text-xl font-bold tracking-tight">{p.nom}</h2>
                <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-mut ring-1 ring-line">
                  {statutLabel(p.statut)}
                </span>
              </div>
              <p className="mt-1 text-sm text-mut">
                {[p.ville, p.departement && `(${p.departement})`, p.centre].filter(Boolean).join(" · ")}
              </p>
              {p.tags && p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 6).map((t) => <Tag key={t} label={t} />)}
                </div>
              )}
              {p.telephone && (
                <a
                  href={`tel:${p.telephone.replace(/\s/g, "")}`}
                  className="mt-3 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent"
                >
                  Appeler {p.telephone}
                </a>
              )}
            </div>

            {/* Bloc unique : enregistrer l'appel + rappel */}
            <InteractionForm
              prospectId={p.id}
              defaultStatut={p.statut ?? ""}
              defaultInteret={p.interet ?? ""}
              onSaved={onClose}
            />

            {/* Historique compact */}
            {data!.calls.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 font-display text-sm font-bold">Historique ({data!.calls.length})</h3>
                <div className="space-y-2">
                  {data!.calls.slice(0, 8).map((c) => {
                    const url = data!.audio[c.id];
                    return (
                      <div key={c.id} className="rounded-xl border border-line bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-bold text-ink">{outcomeLabel(c.outcome)}</span>
                          <span className="text-[11px] text-mut">{fmt(c.created_at)}</span>
                        </div>
                        {c.notes && <p className="mt-1 whitespace-pre-wrap text-[12.5px] text-ink/80">{c.notes}</p>}
                        {url && <audio controls src={url} className="mt-2 h-8 w-full" />}
                        {c.rappel_at && (
                          <p className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            Rappel : {fmt(c.rappel_at)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 text-right">
              <Link href={`/crm/prospect/${p.id}`} onClick={onClose} className="text-xs text-accent hover:underline">
                Ouvrir la fiche complète →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
