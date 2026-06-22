"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, FileDown, Pencil, Trash2 } from "lucide-react";
import { invoiceHTML, eur2, STATUTS_FACTURE, type Invoice } from "@/lib/invoices";
import { setInvoiceStatus, deleteInvoice } from "@/app/crm/actions";
import InvoiceEditor from "./InvoiceEditor";

type Centre = { id: string; nom: string; ville: string | null; email: string | null; telephone: string | null };

const statutMeta = (k: string) => STATUTS_FACTURE.find((s) => s.key === k) ?? STATUTS_FACTURE[0];
const fmtDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function openPrint(html: string) {
  const w = window.open("", "_blank", "width=860,height=1040");
  if (!w) { alert("Autorise les fenêtres pop-up pour exporter la facture."); return; }
  w.document.write(html);
  w.document.close();
}

export default function FacturesApp({ invoices, centres }: { invoices: Invoice[]; centres: Centre[] }) {
  const [editing, setEditing] = useState<Invoice | "new" | null>(null);
  const [pending, start] = useTransition();

  const kpis = useMemo(() => {
    const facture = invoices.filter((i) => i.status !== "annulee").reduce((s, i) => s + (i.total_ttc || 0), 0);
    const paye = invoices.filter((i) => i.status === "payee").reduce((s, i) => s + (i.total_ttc || 0), 0);
    const attente = invoices.filter((i) => i.status === "envoyee").reduce((s, i) => s + (i.total_ttc || 0), 0);
    return { facture, paye, attente };
  }, [invoices]);

  if (editing) {
    return <InvoiceEditor initial={editing === "new" ? null : editing} centres={centres} onClose={() => setEditing(null)} />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Factures</h1>
          <p className="mt-1 text-sm text-mut">{invoices.length} facture(s) · numérotation automatique</p>
        </div>
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent">
          <Plus size={16} /> Nouvelle facture
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-line bg-white p-5"><p className="font-display text-2xl font-bold">{eur2(kpis.facture)}</p><p className="text-sm text-mut">Facturé</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="font-display text-2xl font-bold text-emerald-600">{eur2(kpis.paye)}</p><p className="text-sm text-mut">Encaissé</p></div>
        <div className="rounded-2xl border border-line bg-white p-5"><p className="font-display text-2xl font-bold text-accent">{eur2(kpis.attente)}</p><p className="text-sm text-mut">En attente</p></div>
      </div>

      {invoices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-mut">
          Aucune facture. Crée ta première avec « Nouvelle facture ».
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          {invoices.map((inv, i) => {
            const sm = statutMeta(inv.status);
            return (
              <div key={inv.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}>
                <span className="w-24 shrink-0 font-display text-sm font-bold">{inv.number}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{inv.client?.nom || "—"}</p>
                  <p className="text-[12px] text-mut">{fmtDate(inv.issue_date)}</p>
                </div>
                <span className="shrink-0 font-display text-sm font-bold tabular-nums">{eur2(inv.total_ttc)}</span>
                <select
                  value={inv.status}
                  onChange={(e) => start(async () => { await setInvoiceStatus(inv.id, e.target.value); })}
                  disabled={pending}
                  className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{ color: sm.color, borderColor: sm.color + "55" }}
                >
                  {STATUTS_FACTURE.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing(inv)} title="Modifier" className="rounded-md border border-line p-1.5 text-mut hover:text-ink"><Pencil size={14} /></button>
                  <button onClick={() => openPrint(invoiceHTML(inv))} title="Exporter PDF" className="rounded-md border border-line p-1.5 text-accent hover:bg-accent/10"><FileDown size={14} /></button>
                  <button
                    onClick={() => { if (confirm(`Supprimer la facture ${inv.number} ?`)) start(async () => { await deleteInvoice(inv.id); }); }}
                    title="Supprimer" className="rounded-md border border-line p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
