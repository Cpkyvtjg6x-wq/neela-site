"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Save, X } from "lucide-react";
import { saveInvoice } from "@/app/crm/actions";
import {
  computeTotals, eur2, montantEnLettres, DEFAULT_TERMS, LEGAL_MENTIONS,
  type Invoice, type InvoiceItem, type InvoiceEmitter, type InvoiceClient,
} from "@/lib/invoices";

type Centre = { id: string; nom: string; ville: string | null; email: string | null; telephone: string | null };

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso: string, n: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const EMPTY_EMITTER: InvoiceEmitter = {
  nom: "Neela",
  adresse: "290 Chemin de Pierres Onches, 30140 Anduze",
  siret: "943 171 157 00028",
  tvaIntra: "",
  email: "morfin@neelaagency.com",
  tel: "07 83 64 09 05",
  iban: "",
  bic: "",
};
const EMPTY_CLIENT: InvoiceClient = { nom: "", adresse: "", email: "", siret: "" };

// --- Champs en ligne (le document EST le formulaire) ---
const inlineBase =
  "rounded bg-transparent px-1 -mx-1 outline-none transition-colors placeholder:text-mut/45 hover:bg-black/[0.04] focus:bg-accent/[0.08]";

function Txt({ value, set, placeholder, className = "", list, auto }: { value: string; set: (v: string) => void; placeholder?: string; className?: string; list?: string; auto?: boolean }) {
  // auto = largeur ajustée au contenu (champ « texte » en ligne qui ne tronque pas).
  const style = auto ? { width: `${Math.max((value || placeholder || "").length, 3) + 1}ch` } : undefined;
  return <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} list={list} style={style} className={`${inlineBase} ${className}`} />;
}
function Num({ value, set, className = "" }: { value: number; set: (n: number) => void; className?: string }) {
  return <input type="number" value={value} onChange={(e) => set(Number(e.target.value))} className={`${inlineBase} [appearance:textfield] ${className}`} />;
}
function Area({ value, set, placeholder, rows = 1, className = "" }: { value: string; set: (v: string) => void; placeholder?: string; rows?: number; className?: string }) {
  return <textarea value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={rows} className={`${inlineBase} block w-full resize-none ${className}`} />;
}
function DateInp({ value, set, className = "" }: { value: string; set: (v: string) => void; className?: string }) {
  return <input type="date" value={value} onChange={(e) => set(e.target.value)} className={`${inlineBase} ${className}`} />;
}

export default function InvoiceEditor({
  initial,
  centres,
  onClose,
  prefill,
}: {
  initial: Invoice | null;
  centres: Centre[];
  onClose: () => void;
  prefill?: { prospectId?: string; nom: string; email?: string | null; docType?: "facture" | "devis"; items?: InvoiceItem[] };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [emitter, setEmitter] = useState<InvoiceEmitter>(initial?.emitter ?? EMPTY_EMITTER);
  const [client, setClient] = useState<InvoiceClient>(
    initial?.client ?? (prefill ? { ...EMPTY_CLIENT, nom: prefill.nom, email: prefill.email ?? "" } : EMPTY_CLIENT)
  );
  const [prospectId, setProspectId] = useState<string | null>(initial?.prospect_id ?? prefill?.prospectId ?? null);
  const [issueDate, setIssueDate] = useState(initial?.issue_date ?? todayISO());
  const [dueDate, setDueDate] = useState(initial?.due_date ?? addDaysISO(todayISO(), 30));
  const [saleDate, setSaleDate] = useState(initial?.sale_date ?? "");
  const [status, setStatus] = useState(initial?.status ?? "brouillon");
  const [docType, setDocType] = useState<"facture" | "devis">(initial?.doc_type ?? prefill?.docType ?? "facture");
  const [validUntil, setValidUntil] = useState(initial?.valid_until ?? addDaysISO(todayISO(), 30));
  const [items, setItems] = useState<InvoiceItem[]>(
    initial?.items?.length ? initial.items : (prefill?.items?.length ? prefill.items : [{ designation: "Gestion campagnes Meta Ads", qty: 1, unit: 0 }])
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
    doc_type: docType, valid_until: docType === "devis" ? (validUntil || null) : null,
    status, issue_date: issueDate, due_date: dueDate || null, sale_date: saleDate || null,
    prospect_id: prospectId, client, emitter, items,
    vat_enabled: vatEnabled, vat_rate: vatRate,
    discount_type: discountType, discount_value: discountValue, deposit,
    notes: notes || null, payment_terms: terms || null,
  });

  function buildInvoice(number: string, id: string): Invoice {
    return {
      id, created_at: "", updated_at: "", year: 0, seq: 0, number,
      doc_type: docType, valid_until: docType === "devis" ? (validUntil || null) : null,
      status, issue_date: issueDate, due_date: dueDate || null, sale_date: saleDate || null,
      prospect_id: prospectId, client, emitter, items,
      vat_enabled: vatEnabled, vat_rate: vatRate,
      discount_type: discountType, discount_value: discountValue, deposit,
      notes: notes || null, payment_terms: terms || null,
      total_ht: t.ht, total_tva: t.tva, total_ttc: t.ttc,
    };
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

  // Enregistre puis télécharge un VRAI fichier PDF (.pdf) — s'ouvre dans Aperçu (Mac)
  // / le lecteur PDF par défaut (Windows).
  function saveAndExport() {
    setErr(null);
    if (!client.nom.trim()) { setErr("Le nom du client est obligatoire."); return; }
    start(async () => {
      const res = await saveInvoice(payload());
      if (!res.ok) { setErr(res.error || "Erreur lors de l'enregistrement."); return; }
      router.refresh();
      const finalInv = buildInvoice(res.number || initial?.number || "—", res.id || initial?.id || "");
      try {
        const { downloadInvoicePdf } = await import("@/lib/invoicePdf");
        await downloadInvoicePdf(finalInv);
      } catch (e) {
        setErr("Échec de la génération du PDF : " + (e as Error).message);
      }
    });
  }

  const setItem = (i: number, patch: Partial<InvoiceItem>) =>
    setItems((arr) => arr.map((it, k) => (k === i ? { ...it, ...patch } : it)));

  const onClientName = (v: string) => {
    const c = centres.find((x) => x.nom === v);
    setClient((cl) => ({ ...cl, nom: v, email: cl.email || (c?.email ?? "") }));
    if (c) setProspectId(c.id);
  };

  const isDevis = docType === "devis";
  const title = isDevis ? "Devis" : "Facture";
  const amountWords = !isDevis && deposit > 0 ? t.net : t.ttc;
  const seg = (on: boolean) => `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${on ? "bg-ink text-paper" : "text-mut hover:text-ink"}`;

  const STAMP: Record<string, [string, string]> = {
    brouillon: ["BROUILLON", "#94a3b8"], payee: ["PAYÉE", "#059669"], annulee: ["ANNULÉE", "#dc2626"],
  };
  const sm = STAMP[status];

  return (
    <div>
      {/* Barre d'actions (pas de champs latéraux : on remplit le document) */}
      <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-2 border-b border-line bg-paper/90 py-3 backdrop-blur">
        <h1 className="mr-1 font-display text-lg font-bold tracking-tight">
          {initial ? `${initial.doc_type === "devis" ? "Devis" : "Facture"} ${initial.number}` : "Nouveau document"}
        </h1>
        {!initial && (
          <div className="inline-flex rounded-full border border-line bg-white p-1">
            <button onClick={() => setDocType("facture")} className={seg(!isDevis)}>Facture</button>
            <button onClick={() => setDocType("devis")} className={seg(isDevis)}>Devis</button>
          </div>
        )}
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold outline-none">
          <option value="brouillon">Brouillon</option>
          <option value="envoyee">Envoyée</option>
          <option value="payee">Payée</option>
          <option value="annulee">Annulée</option>
        </select>
        <label className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold">
          <input type="checkbox" checked={vatEnabled} onChange={(e) => setVatEnabled(e.target.checked)} className="h-3.5 w-3.5 accent-accent" /> TVA
          {vatEnabled && <><input type="number" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="w-11 rounded bg-paper px-1 text-right outline-none" /> %</>}
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-mut hover:border-ink hover:text-ink"><X size={15} /> Fermer</button>
          <button onClick={save} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent disabled:opacity-60"><Save size={15} /> {pending ? "…" : "Enregistrer"}</button>
          <button onClick={saveAndExport} disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"><FileDown size={15} /> Exporter PDF</button>
        </div>
      </div>

      {err && <p className="mb-3 text-sm font-medium text-red-600">{err}</p>}
      <p className="mb-3 text-center text-xs text-mut">Remplissez le document directement — cliquez sur n'importe quel champ.</p>

      {/* DOCUMENT ÉDITABLE */}
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-float">
        <div className="h-1.5 w-full bg-accent" />
        {sm && (
          <div className="pointer-events-none absolute left-1/2 top-[30%] z-10 -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] rounded-md border-[3px] px-5 py-1.5 text-[28px] font-extrabold tracking-[0.15em] opacity-[0.16]"
            style={{ color: sm[1], borderColor: sm[1] }}>{sm[0]}</div>
        )}

        <div className="p-7 text-[13px] leading-relaxed sm:p-9">
          {/* En-tête */}
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
                <span className="h-3 w-3 shrink-0 rounded-full bg-accent" />
                <Txt value={emitter.nom} set={(v) => setEmitter({ ...emitter, nom: v })} placeholder="Neela" className="min-w-0 flex-1 font-display text-2xl font-bold" />
              </div>
              <div className="mt-2 max-w-xs text-[11px] text-mut">
                <Area value={emitter.adresse} set={(v) => setEmitter({ ...emitter, adresse: v })} placeholder="Adresse" className="text-[11px]" />
                <div>SIRET <Txt value={emitter.siret} set={(v) => setEmitter({ ...emitter, siret: v })} placeholder="—" auto className="text-[11px]" /></div>
                <div className="flex flex-wrap items-center">
                  <Txt value={emitter.email} set={(v) => setEmitter({ ...emitter, email: v })} placeholder="email" auto className="text-[11px]" /><span className="px-1">·</span>
                  <Txt value={emitter.tel} set={(v) => setEmitter({ ...emitter, tel: v })} placeholder="tél" auto className="text-[11px]" />
                </div>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-bold">{title}</p>
              <div className="mt-1.5 space-y-0.5 text-[11px] text-mut">
                <div>N° <b className="text-ink">{initial?.number ?? "(attribué à l'enregistrement)"}</b></div>
                <div>{isDevis ? "Émis le" : "Émise le"} <DateInp value={issueDate} set={setIssueDate} className="text-[11px]" /></div>
                {isDevis
                  ? <div>Valable jusqu'au <DateInp value={validUntil} set={setValidUntil} className="text-[11px]" /></div>
                  : <>
                      <div>Échéance <DateInp value={dueDate} set={setDueDate} className="text-[11px]" /></div>
                      <div>Prestation <DateInp value={saleDate} set={setSaleDate} className="text-[11px]" /></div>
                    </>}
              </div>
            </div>
          </div>

          {/* Client uniquement (l'émetteur est déjà en en-tête) — sans cadre */}
          <div className="mb-7 flex justify-end">
            <div className="w-full max-w-[320px]">
              <p className="mb-1 text-[9px] uppercase tracking-[0.12em] text-mut">{isDevis ? "Client" : "Facturé à"}</p>
              <Txt value={client.nom} set={onClientName} list="crm-centres" placeholder="Nom / raison sociale *" className="block w-full text-[14px] font-bold" />
              <Area value={client.adresse} set={(v) => setClient({ ...client, adresse: v })} placeholder="Adresse" className="text-[11px] text-mut" />
              <div className="text-[11px] text-mut">SIRET <Txt value={client.siret} set={(v) => setClient({ ...client, siret: v })} placeholder="—" auto className="text-[11px]" /></div>
              <Txt value={client.email} set={(v) => setClient({ ...client, email: v })} placeholder="email" className="block w-full text-[11px] text-mut" />
              <datalist id="crm-centres">{centres.map((c) => <option key={c.id} value={c.nom} />)}</datalist>
            </div>
          </div>

          {/* Prestations */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink text-[9px] uppercase tracking-wide text-mut">
                <td className="py-2 pr-2">Désignation</td>
                <td className="w-14 py-2 text-right">Qté</td>
                <td className="w-24 py-2 text-right">PU&nbsp;HT</td>
                <td className="w-28 py-2 text-right">Montant</td>
                <td className="w-6" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="group border-b border-line/70">
                  <td className="py-1.5 pr-2"><Txt value={it.designation} set={(v) => setItem(i, { designation: v })} placeholder="Désignation…" className="block w-full" /></td>
                  <td className="py-1.5 text-right"><Num value={it.qty} set={(v) => setItem(i, { qty: v })} className="w-12 text-right tabular-nums" /></td>
                  <td className="py-1.5 text-right"><Num value={it.unit} set={(v) => setItem(i, { unit: v })} className="w-20 text-right tabular-nums" /></td>
                  <td className="py-1.5 text-right font-medium tabular-nums">{eur2((Number(it.qty) || 0) * (Number(it.unit) || 0))}</td>
                  <td className="text-right">
                    <button onClick={() => setItems(items.filter((_, k) => k !== i))} aria-label="Supprimer la ligne" className="text-mut opacity-0 transition group-hover:opacity-100 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setItems([...items, { designation: "", qty: 1, unit: 0 }])} className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"><Plus size={13} /> Ajouter une ligne</button>

          {/* Totaux (remise / acompte en ligne, TVA dans la barre du haut) */}
          <div className="ml-auto mt-5 w-full max-w-[320px] space-y-1.5 text-[13px]">
            {discountType === "none" ? (
              <div className="text-right"><button onClick={() => { setDiscountType("percent"); setDiscountValue(10); }} className="text-[11px] font-semibold text-accent hover:underline">+ Remise</button></div>
            ) : (
              <div className="flex items-center justify-between text-mut">
                <span className="inline-flex items-center gap-1">
                  Remise
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")} className="rounded bg-paper px-0.5 text-[11px] outline-none"><option value="percent">%</option><option value="amount">€</option></select>
                  <Num value={discountValue} set={setDiscountValue} className="w-12 text-right" />
                  <button onClick={() => { setDiscountType("none"); setDiscountValue(0); }} className="text-mut hover:text-red-600"><X size={12} /></button>
                </span>
                <span>− {eur2(t.disc)}</span>
              </div>
            )}
            {vatEnabled ? (
              <>
                <div className="flex justify-between"><span className="text-mut">Total HT</span><span className="font-medium tabular-nums">{eur2(t.ht)}</span></div>
                <div className="flex justify-between"><span className="text-mut">TVA {vatRate}&nbsp;%</span><span className="font-medium tabular-nums">{eur2(t.tva)}</span></div>
                <div className="flex justify-between border-t-2 border-ink pt-1.5 font-display text-base font-bold"><span>Montant total TTC</span><span className="tabular-nums">{eur2(t.ttc)}</span></div>
              </>
            ) : (
              <div className="flex justify-between border-t-2 border-ink pt-1.5 font-display text-base font-bold"><span>Montant total TTC</span><span className="tabular-nums">{eur2(t.ttc)}</span></div>
            )}
            {!isDevis && (deposit > 0 ? (
              <>
                <div className="flex items-center justify-between text-mut">
                  <span className="inline-flex items-center gap-1">Acompte versé <Num value={deposit} set={setDeposit} className="w-16 text-right" /><button onClick={() => setDeposit(0)} className="hover:text-red-600"><X size={12} /></button></span>
                  <span>− {eur2(deposit)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1 font-bold"><span>Net à payer</span><span className="text-accent tabular-nums">{eur2(t.net)}</span></div>
              </>
            ) : (
              <div className="text-right"><button onClick={() => setDeposit(100)} className="text-[11px] font-semibold text-accent hover:underline">+ Acompte</button></div>
            ))}
          </div>

          <p className="mt-3 text-right text-[11px] italic text-mut">Arrêté{isDevis ? "" : "e"} à la somme de {montantEnLettres(amountWords)}.</p>
          {!vatEnabled && <p className="mt-1.5 text-[11px] italic text-mut">TVA non applicable, art. 293 B du CGI.</p>}

          {isDevis && (
            <div className="mt-5">
              <p className="text-[11px] text-mut">Bon pour accord — date et signature du client :</p>
              <div className="mt-1.5 h-16 w-52 rounded-md border border-dashed border-line/70" />
            </div>
          )}

          {/* Conditions / note (éditables) */}
          <div className="mt-6 border-t border-line pt-3">
            <Area value={terms} set={setTerms} rows={3} placeholder="Conditions / mentions de paiement…" className="text-[11px] leading-relaxed text-mut" />
            <Txt value={notes} set={setNotes} placeholder="Note (optionnel)…" className="mt-1 block w-full text-[11px] text-mut" />
          </div>

          {/* Mentions légales permanentes + IBAN/BIC (éditables, jamais codés en dur) */}
          <div className="mt-5 border-t border-line pt-3 text-center text-[10px] leading-relaxed text-mut/80">
            <p>{LEGAL_MENTIONS}</p>
            <div className="mt-0.5 inline-flex flex-wrap items-center justify-center gap-x-0.5">
              <span>· IBAN</span><Txt value={emitter.iban} set={(v) => setEmitter({ ...emitter, iban: v })} placeholder="FR.." auto className="text-center text-[10px]" />
              <span>· BIC</span><Txt value={emitter.bic} set={(v) => setEmitter({ ...emitter, bic: v })} placeholder="—" auto className="text-[10px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
