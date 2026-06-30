"use client";

import {
  computeTotals, eur2, montantEnLettres, fmtDateFr, LEGAL_MENTIONS, DEFAULT_TERMS,
  type Invoice,
} from "@/lib/invoices";

/**
 * Aperçu EN DIRECT de la facture / devis : reproduit le rendu imprimé (charte Neela)
 * et se met à jour à chaque frappe dans l'éditeur. Mentions légales permanentes en bas.
 */
const STAMP: Record<string, [string, string]> = {
  brouillon: ["BROUILLON", "#94a3b8"], payee: ["PAYÉE", "#059669"], annulee: ["ANNULÉE", "#dc2626"],
};

export default function InvoicePreview({ inv }: { inv: Invoice }) {
  const t = computeTotals(inv);
  const e = inv.emitter, c = inv.client;
  const isDevis = inv.doc_type === "devis";
  const title = isDevis ? "Devis" : "Facture";
  const rows = inv.items.filter((i) => i.designation || i.unit || i.qty);
  const amountWords = !isDevis && inv.deposit > 0 ? t.net : t.ttc;
  const sm = STAMP[inv.status];

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-white text-ink shadow-card">
      <div className="h-1.5 w-full bg-accent" />

      {sm && (
        <div className="pointer-events-none absolute left-1/2 top-[34%] z-10 -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] rounded-md border-[3px] px-4 py-1 text-[22px] font-extrabold tracking-[0.15em] opacity-20"
          style={{ color: sm[1], borderColor: sm[1] }}>
          {sm[0]}
        </div>
      )}

      <div className="p-5">
        {/* En-tête */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {e.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.logo} alt={e.nom || "Neela"} className="h-9 max-w-[180px] object-contain" />
            ) : (
              <div className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" /> {e.nom || "Neela"}
              </div>
            )}
            <p className="mt-1.5 text-[10px] leading-relaxed text-mut">
              {e.adresse}
              {e.siret && <><br />SIRET {e.siret}</>}
              {e.tvaIntra && inv.vat_enabled && <><br />TVA {e.tvaIntra}</>}
              {(e.email || e.tel) && <br />}
              {e.email}{e.email && e.tel && " · "}{e.tel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-bold">{title}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-mut">
              N° <b className="text-ink">{inv.number || "(à l'enregistrement)"}</b><br />
              {isDevis ? "Émis" : "Émise"} le {fmtDateFr(inv.issue_date)}
              {isDevis
                ? inv.valid_until && <><br />Valable jusqu'au {fmtDateFr(inv.valid_until)}</>
                : <><br />Échéance : {fmtDateFr(inv.due_date)}{inv.sale_date && <><br />Prestation : {fmtDateFr(inv.sale_date)}</>}</>}
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-line p-2.5">
            <p className="text-[8px] uppercase tracking-[0.12em] text-mut">Émetteur</p>
            <p className="mt-0.5 text-[12px] font-bold leading-tight">{e.nom || "Neela"}</p>
            <p className="text-[10px] leading-snug text-mut">{e.adresse}{e.siret && <><br />SIRET {e.siret}</>}</p>
          </div>
          <div className="rounded-lg border border-line p-2.5">
            <p className="text-[8px] uppercase tracking-[0.12em] text-mut">Client</p>
            <p className="mt-0.5 text-[12px] font-bold leading-tight">{c.nom || "—"}</p>
            <p className="text-[10px] leading-snug text-mut">{c.adresse}{c.siret && <><br />SIRET {c.siret}</>}{c.email && <><br />{c.email}</>}</p>
          </div>
        </div>

        {/* Lignes */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-ink text-[8px] uppercase tracking-wide text-mut">
              <td className="py-1.5 pr-2">Désignation</td>
              <td className="py-1.5 text-right">Qté</td>
              <td className="py-1.5 text-right">PU&nbsp;HT</td>
              <td className="py-1.5 text-right">Montant</td>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((it, i) => (
              <tr key={i} className="border-b border-line/70 text-[11px]">
                <td className="py-1.5 pr-2">{it.designation || <span className="text-mut">—</span>}</td>
                <td className="py-1.5 text-right tabular-nums">{Number(it.qty) || 0}</td>
                <td className="py-1.5 text-right tabular-nums">{eur2(Number(it.unit) || 0)}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">{eur2((Number(it.qty) || 0) * (Number(it.unit) || 0))}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="py-4 text-center text-[11px] text-mut">Ajoutez une prestation pour la voir apparaître…</td></tr>
            )}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="ml-auto mt-3 w-[62%] space-y-1 text-[11px]">
          {t.disc > 0 && <div className="flex justify-between text-mut"><span>Remise</span><span>− {eur2(t.disc)}</span></div>}
          {inv.vat_enabled ? (
            <>
              <div className="flex justify-between"><span className="text-mut">Total HT</span><span className="font-medium">{eur2(t.ht)}</span></div>
              <div className="flex justify-between"><span className="text-mut">TVA {inv.vat_rate}&nbsp;%</span><span className="font-medium">{eur2(t.tva)}</span></div>
              <div className="flex justify-between border-t-2 border-ink pt-1 font-display text-[13px] font-bold"><span>Total TTC</span><span>{eur2(t.ttc)}</span></div>
            </>
          ) : (
            <div className="flex justify-between border-t-2 border-ink pt-1 font-display text-[13px] font-bold"><span>Total</span><span>{eur2(t.ttc)}</span></div>
          )}
          {!isDevis && inv.deposit > 0 && (
            <>
              <div className="flex justify-between text-mut"><span>Acompte versé</span><span>− {eur2(inv.deposit)}</span></div>
              <div className="flex justify-between border-t border-line pt-1 font-bold"><span>Net à payer</span><span className="text-accent">{eur2(t.net)}</span></div>
            </>
          )}
        </div>

        <p className="mt-2 text-right text-[10px] italic text-mut">
          Arrêté{isDevis ? "" : "e"} à la somme de {montantEnLettres(amountWords)}.
        </p>
        {!inv.vat_enabled && <p className="mt-1.5 text-[9.5px] italic text-mut">TVA non applicable, art. 293 B du CGI.</p>}

        {/* Paiement / signature */}
        {isDevis ? (
          <div className="mt-3">
            <p className="text-[9px] text-mut">Bon pour accord — date et signature du client :</p>
            <div className="mt-1 h-12 w-40 rounded-md border border-dashed border-line/70" />
          </div>
        ) : e.iban ? (
          <div className="mt-3 rounded-lg border border-[#DCE6FB] bg-[#F4F7FE] p-2.5 text-[10px]">
            Règlement par virement — <b className="text-[#1E3A8A]">IBAN</b> {e.iban}{e.bic && <> · <b className="text-[#1E3A8A]">BIC</b> {e.bic}</>}
          </div>
        ) : null}

        {/* Conditions */}
        <div className="mt-3 whitespace-pre-line border-t border-line pt-2 text-[8.5px] leading-relaxed text-mut">
          {isDevis
            ? `Devis valable ${inv.valid_until ? `jusqu'au ${fmtDateFr(inv.valid_until)}` : "30 jours"}. Une fois accepté, il fera l'objet d'une facture.`
            : (inv.payment_terms || DEFAULT_TERMS)}
          {inv.notes ? `\n\n${inv.notes}` : ""}
        </div>

        {/* Mentions légales permanentes */}
        <p className="mt-2.5 text-center text-[8px] leading-relaxed text-mut/80">{LEGAL_MENTIONS}</p>
      </div>
    </div>
  );
}
