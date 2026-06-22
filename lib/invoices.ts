// Types & helpers du générateur de factures (régime franchise en base par défaut).

export type InvoiceItem = { designation: string; qty: number; unit: number }; // unit = PU HT
export type InvoiceClient = { nom: string; adresse: string; email: string; siret: string };
export type InvoiceEmitter = {
  nom: string; adresse: string; siret: string; tvaIntra: string;
  email: string; tel: string; iban: string; bic: string;
};

export type Invoice = {
  id: string;
  created_at: string;
  updated_at: string;
  year: number;
  seq: number;
  number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  sale_date: string | null;
  prospect_id: string | null;
  client: InvoiceClient;
  emitter: InvoiceEmitter;
  items: InvoiceItem[];
  vat_enabled: boolean;
  vat_rate: number;
  discount_type: "none" | "percent" | "amount";
  discount_value: number;
  deposit: number;
  notes: string | null;
  payment_terms: string | null;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
};

// Données envoyées au serveur pour créer / mettre à jour une facture.
export type InvoiceInput = Omit<Invoice, "id" | "created_at" | "updated_at" | "year" | "seq" | "number" | "total_ht" | "total_tva" | "total_ttc"> & {
  id?: string;
};

export const STATUTS_FACTURE: { key: string; label: string; color: string }[] = [
  { key: "brouillon", label: "Brouillon", color: "#64748b" },
  { key: "envoyee", label: "Envoyée", color: "#2563eb" },
  { key: "payee", label: "Payée", color: "#059669" },
  { key: "annulee", label: "Annulée", color: "#dc2626" },
];

export const DEFAULT_TERMS =
  "Paiement à 30 jours à réception de facture. En cas de retard : pénalités au taux de 3 fois l'intérêt légal et indemnité forfaitaire de recouvrement de 40 € (art. L441-10 et D441-5 du code de commerce). Pas d'escompte pour paiement anticipé.";

export function computeTotals(inv: {
  items: InvoiceItem[];
  discount_type: "none" | "percent" | "amount";
  discount_value: number;
  vat_enabled: boolean;
  vat_rate: number;
  deposit: number;
}) {
  const sub = inv.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unit) || 0), 0);
  const disc =
    inv.discount_type === "percent" ? sub * ((Number(inv.discount_value) || 0) / 100)
    : inv.discount_type === "amount" ? Number(inv.discount_value) || 0
    : 0;
  const ht = Math.max(0, sub - disc);
  const tva = inv.vat_enabled ? ht * ((Number(inv.vat_rate) || 0) / 100) : 0;
  const ttc = ht + tva;
  const net = ttc - (Number(inv.deposit) || 0);
  return { sub, disc, ht, tva, ttc, net };
}

export const eur2 = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const dfr = (d: string | null) =>
  d ? new Date(d + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "—";

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// HTML d'une facture, prêt à imprimer / exporter en PDF (charte Neela).
export function invoiceHTML(inv: Invoice): string {
  const t = computeTotals(inv);
  const e = inv.emitter, c = inv.client;
  const rows = inv.items
    .filter((i) => i.designation || i.unit || i.qty)
    .map((i) => {
      const ht = (Number(i.qty) || 0) * (Number(i.unit) || 0);
      return `<tr><td>${esc(i.designation)}</td><td class="r">${Number(i.qty) || 0}</td><td class="r">${eur2(Number(i.unit) || 0)}</td><td class="r">${eur2(ht)}</td></tr>`;
    })
    .join("");

  const tvaLines = inv.vat_enabled
    ? `<tr><td>Total HT</td><td class="r">${eur2(t.ht)}</td></tr>
       <tr><td>TVA ${inv.vat_rate} %</td><td class="r">${eur2(t.tva)}</td></tr>
       <tr class="tot"><td>Total TTC</td><td class="r">${eur2(t.ttc)}</td></tr>`
    : `<tr class="tot"><td>Total</td><td class="r">${eur2(t.ttc)}</td></tr>`;

  const depositLine = inv.deposit > 0 ? `<tr><td>Acompte déjà versé</td><td class="r">− ${eur2(inv.deposit)}</td></tr><tr class="tot"><td>Net à payer</td><td class="r">${eur2(t.net)}</td></tr>` : "";
  const discLine = t.disc > 0 ? `<tr><td>Remise</td><td class="r">− ${eur2(t.disc)}</td></tr>` : "";
  const vatMention = inv.vat_enabled ? "" : `<p class="mention">TVA non applicable, art. 293 B du CGI.</p>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${esc(inv.number)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0A0A0A;padding:46px;max-width:820px;margin:auto;font-size:13px;line-height:1.5}
  .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:34px}
  .brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:22px;letter-spacing:-.02em}
  .dot{width:11px;height:11px;border-radius:50%;background:#2563EB;display:inline-block}
  .em{font-size:12px;color:#444;margin-top:10px;line-height:1.6}
  .doc{text-align:right}
  .doc h1{font-size:26px;letter-spacing:-.02em}
  .doc .meta{font-size:12px;color:#6B7280;margin-top:8px;line-height:1.7}
  .parties{display:flex;justify-content:space-between;gap:24px;margin:10px 0 26px}
  .box{flex:1;border:1px solid rgba(10,10,10,.12);border-radius:12px;padding:14px}
  .box .lab{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6B7280;margin-bottom:6px}
  .box .nm{font-weight:700;font-size:14px}
  table{width:100%;border-collapse:collapse}
  thead td{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6B7280;padding:8px 10px;border-bottom:2px solid #0A0A0A}
  tbody td{padding:10px;border-bottom:1px solid rgba(10,10,10,.08)}
  .r{text-align:right;white-space:nowrap}
  .totals{margin-top:18px;margin-left:auto;width:300px}
  .totals td{padding:7px 10px;border-bottom:1px solid rgba(10,10,10,.08)}
  .totals .tot td{border-bottom:none;border-top:2px solid #0A0A0A;font-weight:800;font-size:15px}
  .pay{margin-top:26px;background:#F4F7FE;border:1px solid #DCE6FB;border-radius:12px;padding:14px;font-size:12px}
  .pay b{color:#1E3A8A}
  .mention{margin-top:14px;font-size:12px;color:#444;font-style:italic}
  .foot{margin-top:28px;border-top:1px solid rgba(10,10,10,.1);padding-top:12px;font-size:10.5px;color:#888;line-height:1.6}
  @media print{body{padding:24px}}
</style></head><body>
  <div class="top">
    <div>
      <div class="brand"><span class="dot"></span> ${esc(e.nom || "Neela")}</div>
      <div class="em">${esc(e.adresse || "")}${e.siret ? `<br>SIRET : ${esc(e.siret)}` : ""}${e.tvaIntra && inv.vat_enabled ? `<br>TVA : ${esc(e.tvaIntra)}` : ""}${e.email ? `<br>${esc(e.email)}` : ""}${e.tel ? ` · ${esc(e.tel)}` : ""}</div>
    </div>
    <div class="doc">
      <h1>Facture</h1>
      <div class="meta">N° <b>${esc(inv.number)}</b><br>Émise le ${dfr(inv.issue_date)}<br>Échéance : ${dfr(inv.due_date)}${inv.sale_date ? `<br>Prestation : ${dfr(inv.sale_date)}` : ""}</div>
    </div>
  </div>

  <div class="parties">
    <div class="box"><div class="lab">Émetteur</div><div class="nm">${esc(e.nom || "Neela")}</div><div class="em">${esc(e.adresse || "")}${e.siret ? `<br>SIRET ${esc(e.siret)}` : ""}</div></div>
    <div class="box"><div class="lab">Client</div><div class="nm">${esc(c.nom || "—")}</div><div class="em">${esc(c.adresse || "")}${c.siret ? `<br>SIRET ${esc(c.siret)}` : ""}${c.email ? `<br>${esc(c.email)}` : ""}</div></div>
  </div>

  <table>
    <thead><tr><td>Désignation</td><td class="r">Qté</td><td class="r">PU HT</td><td class="r">Montant HT</td></tr></thead>
    <tbody>${rows || `<tr><td colspan="4" style="color:#888">Aucune ligne</td></tr>`}</tbody>
  </table>

  <table class="totals">${discLine}${tvaLines}${depositLine}</table>

  ${vatMention}

  ${e.iban ? `<div class="pay">Règlement par virement — <b>IBAN</b> ${esc(e.iban)}${e.bic ? ` · <b>BIC</b> ${esc(e.bic)}` : ""}</div>` : ""}

  <div class="foot">${esc(inv.payment_terms || DEFAULT_TERMS)}${inv.notes ? `<br><br>${esc(inv.notes)}` : ""}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
</body></html>`;
}
