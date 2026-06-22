"use client";

import { Phone, Check } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { telHref } from "@/lib/telephony";
import { clearRappel } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";

export type RelanceItem = {
  key: string;
  prospect: Prospect;
  reason: string;
  callId?: string;
  kind: "overdue" | "today" | "proposition";
};

const DOT: Record<RelanceItem["kind"], string> = { overdue: "#dc2626", today: "#d97706", proposition: "#7c3aed" };

function Group({ title, accent, items }: { title: string; accent: string; items: RelanceItem[] }) {
  const { open } = useFiche();
  if (!items.length) return null;
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{title} ({items.length})</h2>
      <div className="space-y-2">
        {items.map((it) => {
          const href = telHref(it.prospect.telephone);
          return (
            <div key={it.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DOT[it.kind] }} />
              <button onClick={() => open(it.prospect.id, it.prospect)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-[15px] font-semibold hover:text-accent">{it.prospect.nom}</p>
                <p className="truncate text-[12px] text-mut">{it.reason}{it.prospect.ville ? ` · ${it.prospect.ville}` : ""}</p>
              </button>
              {href && (
                <a href={href} title="Appeler" className="rounded-md border border-line p-1.5 text-ink hover:border-accent hover:text-accent"><Phone size={14} /></a>
              )}
              {it.callId && (
                <form action={clearRappel}>
                  <input type="hidden" name="call_id" value={it.callId} />
                  <input type="hidden" name="prospect_id" value={it.prospect.id} />
                  <button title="Marquer comme traité" className="rounded-md border border-line p-1.5 text-emerald-600 hover:bg-emerald-50"><Check size={14} /></button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RelancesList({ overdue, today, propositions }: { overdue: RelanceItem[]; today: RelanceItem[]; propositions: RelanceItem[] }) {
  if (!overdue.length && !today.length && !propositions.length) {
    return <p className="rounded-2xl border border-dashed border-line px-4 py-16 text-center text-sm text-mut">Rien à relancer aujourd'hui 🎉</p>;
  }
  return (
    <div className="space-y-7">
      <Group title="En retard" accent="#dc2626" items={overdue} />
      <Group title="À relancer aujourd'hui" accent="#d97706" items={today} />
      <Group title="Propositions en attente" accent="#7c3aed" items={propositions} />
    </div>
  );
}
