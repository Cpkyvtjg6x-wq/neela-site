"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Save, X } from "lucide-react";
import { saveInvoice } from "@/app/crm/actions";
import {
  computeTotals, eur2, invoiceHTML, DEFAULT_TERMS,
  type Invoice, type InvoiceItem, type InvoiceEmitter, type InvoiceClient,
} from "@/lib/invoices";

type Centre = { id: string; nom: string; ville: string | null; email: string | null; telephone: string | null };

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const EMPTY_EMITTER: InvoiceEmitter = { nom: "Neela", adresse: "", siret: "", tvaIntra: "", email: "", tel: "", iban: "", bic: "" };
const EMPTY_CLIENT: InvoiceClient = { nom: "", adresse: "", email: "", siret: "" };

export default function InvoiceEditor({
  initial,
  centres,
  onClose,
}: {
  initial: Invoice | null;
  centres: Centre[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [emitter, setEmitter] = useState<InvoiceEmitter>(initial?.emitter ?? EMPTY_EMITTER);
  const [client, setClient] = useState<InvoiceClient>(initial?.client ?? EMPTY_CLIENT);
  const [prospectId, setProspectId] = useState<string | null>(initial?.prospect_id ?? null);
  const [issueDate, setIssueDate] = useState(initial?.issue_date ?? todayISO());
  const [dueDate, setDueDate] = useState(initial?.due_date ?? addDaysISO(todayISO(), 30));
  const [saleDate, setSaleDate] = useState(initial?.sale_date ?? "");
  const [status, setStatus] = useState(initial?.status ?? "brouillon");
  const [items, setItems] = useState<InvoiceItem[]>(
    initial?.items?.length ? initial.items : [{ designation: "Gestion campagnes Meta Ads", qty: 1, unit: 0 }]
  );
  const [vatEnabled, setVatEnabled] = useState(initial?.vat_enabled ?? false);
  const [vatRate, setVatRate] = useState(initial?.vat_rate ?? 20);
  const [discountType, setDiscountType] = useState<"none" | "percent" | "amount">(initial?.discount_type ?? "none");
  const [discountValue, setDiscountValue] = useState(initial?.discount_value ?? 0);
  const [deposit, setDeposit] = useState(initial?.deposit ?? 0);
  const [terms, setTerms] = useState(initial?.payment_terms ?? DEFAULT_TERMS);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Émetteur mémorisé dans le navigateur (saisi une fois).
  useEffect(() => {
    if (initial) return;
    try {
      const raw = localStorage.getItem("neela_invoice_emitter");
      if (raw) setEmitter({ ...EMPTY_EMITTER, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, [initial]);
  useEffect(() => {
    try { localStorage.setItem("neela_invoice_emitter", JSON.stringify(emitter)); } catch { /* ignore */ }
  }, [emitter]);

  const t = computeTotals({ items, discount_type: discountType, discount_value: discountValue, vat_enabled: vatEnabled, vat_rate: vatRate, deposit });

  const payload = () => ({
    id: initial?.id,
    status, issue_date: issueDate, due_date: dueDate || null, sale_date: saleDate || null,
    prospect_id: prospectId, client, emitter, items,
    vat_enabled: vatEnabled, vat_rate: vatRate,
    discount_type: discountType, discount_value: discountValue, deposit,
    notes: notes || null, payment_terms: terms || null,
  });

  function buildInvoice(number: string, id: string): Invoice {
    return {
      id, created_at: "", updated_at: "", year: 0, seq: 0, number,
      status, issue_date: issueDate, due_date: dueDate || null, sale_date: saleDate || null,
      prospect_id: prospectId, client, emitter, items,
      vat_enabled: vatEnabled, vat_rate: vatRate,
      discount_type: discountType, discount_value: discountValue, deposit,
      notes: notes || null, payment_terms: terms || null,
      total_ht: t.ht, total_tva: t.tva, total_ttc: t.ttc,
    };
  }

  function openPrint(html: string) {
    const w = window.open("", "_blank", "width=860,height=1040");
    if (!w) { alert("Autorise les fenêtres pop-up pour exporter la facture."); return; }
    w.document.write(html);
    w.document.close();
  }

  function save() {
    setErr(null);
    if (!client.nom.trim()) { setErr("Le nom du client est obligatoire."); return; }
    start(async () => {
      const res = await saveInvoice(payload());
      if (!res.ok) { setErr(res.error || "Erreur lors de l'enregistrement."); return; }
      router.refresh();
      onClose();
    });
  }

  function saveAndExport() {
    setErr(null);
    if (!client.nom.trim()) { setErr("Le nom du client est obligatoire."); return; }
    // On ouvre la fenêtre AVANT l'await (sinon le navigateur la bloque comme pop-up).
    const w = window.open("", "_blank", "width=860,height=1040");
    start(async () => {
      const res = await saveInvoice(payload());
      if (!res.ok) { setErr(res.error || "Erreur lors de l'enregistrement."); w?.close(); return; }
      router.refresh();
      const html = invoiceHTML(buildInvoice(res.number || initial?.number || "—", res.id || initial?.id || ""));
      if (w) { w.document.write(html); w.document.close(); } else { openPrint(html); }
    });
  }

  const field = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";
  const card = "rounded-2xl border border-line bg-white p-5";

  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setItems((arr) => arr.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{initial ? `Facture ${initial.number}` : "Nouvelle facture"}</h1>
          <p className="mt-1 text-sm text-mut">{initial ? "Modification" : "Le numéro est attribué automatiquement à l'enregistrement."}</p>
        </div>
        <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-mut hover:border-ink hover:text-ink">
          <X size={15} /> Fermer
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Émetteur */}
        <details className={card} open={!initial}>
          <summary className="cursor-pointer font-display text-base font-bold">Émetteur (toi)</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><p className={label}>Raison sociale / nom</p><input value={emitter.nom} onChange={(e) => setEmitter({ ...emitter, nom: e.target.value })} className={field} /></div>
            <div className="sm:col-span-2"><p className={label}>Adresse</p><input value={emitter.adresse} onChange={(e) => setEmitter({ ...emitter, adresse: e.target.value })} className={field} /></div>
            <div><p className={label}>SIRET</p><input value={emitter.siret} onChange={(e) => setEmitter({ ...emitter, siret: e.target.value })} className={field} /></div>
            {vatEnabled && <div><p className={label}>N° TVA intracom.</p><input value={emitter.tvaIntra} onChange={(e) => setEmitter({ ...emitter, tvaIntra: e.target.value })} className={field} /></div>}
            <div><p className={label}>Email</p><input value={emitter.email} onChange={(e) => setEmitter({ ...emitter, email: e.target.value })} className={field} /></div>
            <div><p className={label}>Téléphone</p><input value={emitter.tel} onChange={(e) => setEmitter({ ...emitter, tel: e.target.value })} className={field} /></div>
            <div><p className={label}>IBAN</p><input value={emitter.iban} onChange={(e) => setEmitter({ ...emitter, iban: e.target.value })} className={field} /></div>
            <div><p className={label}>BIC</p><input value={emitter.bic} onChange={(e) => setEmitter({ ...emitter, bic: e.target.value })} className={field} /></div>
          </div>
          <p className="mt-2 text-[11px] text-mut">Tes coordonnées sont mémorisées dans ce navigateur pour les prochaines factures.</p>
        </details>

        {/* Client */}
        <div className={card}>
          <h2 className="mb-4 font-display text-base font-bold">Client</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className={label}>Depuis le CRM</p>
              <select
                value={prospectId ?? ""}
                onChange={(e) => {
                  const c = centres.find((x) => x.id === e.target.value);
                  setProspectId(e.target.value || null);
                  if (c) setClient({ ...client, nom: c.nom, email: c.email ?? client.email });
                }}
                className={field}
              >
                <option value="">— Saisie manuelle —</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` · ${c.ville}` : ""}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><p className={label}>Nom / raison sociale *</p><input value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} className={field} /></div>
            <div className="sm:col-span-2"><p className={label}>Adresse</p><input value={client.adresse} onChange={(e) => setClient({ ...client, adresse: e.target.value })} className={field} /></div>
            <div><p className={label}>Email</p><input value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} className={field} /></div>
            <div><p className={label}>SIRET (si pro)</p><input value={client.siret} onChange={(e) => setClient({ ...client, siret: e.target.value })} className={field} /></div>
          </div>
        </div>

        {/* Dates & statut */}
        <div className={card}>
          <h2 className="mb-4 font-display text-base font-bold">Dates & statut</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className={label}>Date d'émission</p><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={field} /></div>
            <div><p className={label}>Échéance</p><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} /></div>
            <div><p className={label}>Date de prestation</p><input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={field} /></div>
            <div>
              <p className={label}>Statut</p>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className={card}>
          <h2 className="mb-4 font-display text-base font-bold">Options</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="h-4 w-4 rounded border-line accent-accent" />
            Assujetti à la TVA (sinon : franchise en base, art. 293 B)
          </label>
          {vatEnabled && (
            <div className="mt-3"><p className={label}>Taux de TVA (%)</p><input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className={field} /></div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className={label}>Remise</p>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "none" | "percent" | "amount")} className={field}>
                <option value="none">Aucune</option>
                <option value="percent">En %</option>
                <option value="amount">En €</option>
              </select>
            </div>
            <div><p className={label}>Valeur remise</p><input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} disabled={discountType === "none"} className={`${field} disabled:opacity-50`} /></div>
          </div>
          <div className="mt-3"><p className={label}>Acompte déjà versé (€)</p><input type="number" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))} className={field} /></div>
        </div>

        {/* Lignes */}
        <div className={`${card} lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Prestations</h2>
            <button onClick={() => setItems([...items, { designation: "", qty: 1, unit: 0 }])} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent">
              <Plus size={14} /> Ligne
            </button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_110px_110px_32px] items-center gap-2">
                <input value={it.designation} onChange={(e) => setItem(i, { designation: e.target.value })} placeholder="Désignation" className={field} />
                <input type="number" value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} className={`${field} text-right`} />
                <input type="number" value={it.unit} onChange={(e) => setItem(i, { unit: Number(e.target.value) })} placeholder="PU HT" className={`${field} text-right`} />
                <span className="text-right text-sm font-semibold tabular-nums">{eur2((Number(it.qty) || 0) * (Number(it.unit) || 0))}</span>
                <button onClick={() => setItems(items.filter((_, k) => k !== i))} className="text-mut hover:text-red-600" aria-label="Supprimer la ligne"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className={label}>Conditions / mentions de paiement</p>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} className={field} />
              <p className={`${label} mt-3`}>Note (optionnel)</p>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={field} />
            </div>
            <div className="rounded-2xl bg-paper p-4">
              <div className="space-y-1.5 text-sm">
                {t.disc > 0 && <div className="flex justify-between text-mut"><span>Sous-total</span><span>{eur2(t.sub)}</span></div>}
                {t.disc > 0 && <div className="flex justify-between text-mut"><span>Remise</span><span>− {eur2(t.disc)}</span></div>}
                <div className="flex justify-between"><span className="text-mut">Total HT</span><span className="font-semibold">{eur2(t.ht)}</span></div>
                {vatEnabled && <div className="flex justify-between"><span className="text-mut">TVA {vatRate} %</span><span className="font-semibold">{eur2(t.tva)}</span></div>}
                <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-bold"><span>Total {vatEnabled ? "TTC" : ""}</span><span className="text-accent">{eur2(t.ttc)}</span></div>
                {deposit > 0 && <div className="flex justify-between border-t border-line pt-2 text-sm"><span className="text-mut">Net à payer</span><span className="font-bold">{eur2(t.net)}</span></div>}
              </div>
              {!vatEnabled && <p className="mt-3 text-[11px] italic text-mut">TVA non applicable, art. 293 B du CGI.</p>}
            </div>
          </div>
        </div>
      </div>

      {err && <p className="mt-4 text-sm font-medium text-red-600">{err}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => save()} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent disabled:opacity-60">
          <Save size={16} /> {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button onClick={saveAndExport} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
          <FileDown size={16} /> Enregistrer & exporter PDF
        </button>
      </div>
    </div>
  );
}
