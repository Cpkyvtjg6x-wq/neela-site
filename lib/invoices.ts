// Types & helpers du générateur de factures / devis (régime franchise en base par défaut).

export type InvoiceItem = { designation: string; qty: number; unit: number }; // unit = PU HT
export type InvoiceClient = { nom: string; adresse: string; email: string; siret: string };
export type InvoiceEmitter = {
  nom: string; adresse: string; siret: string; tvaIntra: string;
  email: string; tel: string; iban: string; bic: string; logo?: string;
};

export type DocType = "facture" | "devis";

export type Invoice = {
  id: string;
  created_at: string;
  updated_at: string;
  year: number;
  seq: number;
  number: string;
  doc_type: DocType;
  valid_until: string | null;
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

// --- Montant en toutes lettres (français) ---
const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];
function below100(n: number): string {
  if (n < 20) return U[n];
  const t = Math.floor(n / 10), u = n % 10;
  if (t === 7) return u === 1 ? "soixante et onze" : "soixante-" + U[10 + u];
  if (t === 9) return "quatre-vingt-" + U[10 + u];
  let w = TENS[t];
  if (t === 8 && u === 0) return "quatre-vingts";
  if (u === 0) return w;
  if (u === 1 && t !== 8) return w + " et un";
  return w + "-" + U[u];
}
function below1000(n: number): string {
  const c = Math.floor(n / 100), r = n % 100;
  if (c === 0) return below100(r);
  let s = c === 1 ? "cent" : U[c] + " cent";
  if (r === 0 && c > 1) s += "s";
  if (r > 0) s += " " + below100(r);
  return s;
}
function toWords(n: number): string {
  if (n === 0) return "zéro";
  const mil = Math.floor(n / 1000000), th = Math.floor((n % 1000000) / 1000), r = n % 1000;
  const parts: string[] = [];
  if (mil > 0) parts.push(mil === 1 ? "un million" : below1000(mil) + " millions");
  if (th > 0) parts.push(th === 1 ? "mille" : below1000(th) + " mille");
  if (r > 0) parts.push(below1000(r));
  return parts.join(" ");
}
export function montantEnLettres(amount: number): string {
  const a = Math.round((Number(amount) || 0) * 100) / 100;
  const euros = Math.floor(a), cents = Math.round((a - euros) * 100);
  let s = `${toWords(euros)} euro${euros > 1 ? "s" : ""}`;
  if (cents > 0) s += ` et ${toWords(cents)} centime${cents > 1 ? "s" : ""}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// HTML d'une facture/devis, prêt à imprimer / exporter en PDF (charte Neela).
export function invoiceHTML(inv: Invoice): string {
  const t = computeTotals(inv);
  const e = inv.emitter, c = inv.client;
  const isDevis = inv.doc_type === "devis";
  const title = isDevis ? "Devis" : "Facture";

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
  const depositLine = !isDevis && inv.deposit > 0 ? `<tr><td>Acompte déjà versé</td><td class="r">− ${eur2(inv.deposit)}</td></tr><tr class="tot"><td>Net à payer</td><td class="r">${eur2(t.net)}</td></tr>` : "";
  const discLine = t.disc > 0 ? `<tr><td>Remise</td><td class="r">− ${eur2(t.disc)}</td></tr>` : "";
  const vatMention = inv.vat_enabled ? "" : `<p class="mention">TVA non applicable, art. 293 B du CGI.</p>`;

  const amountWords = !isDevis && inv.deposit > 0 ? t.net : t.ttc;
  const lettres = `<p class="lettres">Arrêté${isDevis ? "" : "e"} à la somme de ${esc(montantEnLettres(amountWords))}.</p>`;

  const stampMap: Record<string, [string, string]> = {
    brouillon: ["BROUILLON", "#94a3b8"], payee: ["PAYÉE", "#059669"], annulee: ["ANNULÉE", "#dc2626"],
  };
  const sm = stampMap[inv.status];
  const stamp = sm ? `<div class="stamp" style="color:${sm[1]};border-color:${sm[1]}">${sm[0]}</div>` : "";

  const logoHtml = e.logo
    ? `<img src="${esc(e.logo)}" alt="${esc(e.nom || "Neela")}" style="height:44px;max-width:220px;object-fit:contain"/>`
    : `<div class="brand"><span class="dot"></span> ${esc(e.nom || "Neela")}</div>`;

  const meta = isDevis
    ? `N° <b>${esc(inv.number)}</b><br>Émis le ${dfr(inv.issue_date)}${inv.valid_until ? `<br>Valable jusqu'au ${dfr(inv.valid_until)}` : ""}`
    : `N° <b>${esc(inv.number)}</b><br>Émise le ${dfr(inv.issue_date)}<br>Échéance : ${dfr(inv.due_date)}${inv.sale_date ? `<br>Prestation : ${dfr(inv.sale_date)}` : ""}`;

  const bottom = isDevis
    ? `<div class="sign"><div class="siglab">Bon pour accord — date et signature du client :</div><div class="sigbox"></div></div>`
    : (e.iban ? `<div class="pay">Règlement par virement — <b>IBAN</b> ${esc(e.iban)}${e.bic ? ` · <b>BIC</b> ${esc(e.bic)}` : ""}</div>` : "");

  const foot = isDevis
    ? `Devis valable ${inv.valid_until ? `jusqu'au ${dfr(inv.valid_until)}` : "30 jours"}. Une fois accepté, il fera l'objet d'une facture.${inv.notes ? `<br><br>${esc(inv.notes)}` : ""}`
    : `${esc(inv.payment_terms || DEFAULT_TERMS)}${inv.notes ? `<br><br>${esc(inv.notes)}` : ""}`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title} ${esc(inv.number)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{position:relative;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0A0A0A;padding:46px;max-width:820px;margin:auto;font-size:13px;line-height:1.5}
  .bar{position:fixed;top:0;left:0;right:0;height:6px;background:#2563EB}
  .stamp{position:absolute;top:54px;right:46px;transform:rotate(-11deg);border:3px solid;border-radius:8px;padding:3px 14px;font-weight:800;font-size:20px;letter-spacing:2px;opacity:.85}
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
  .lettres{margin-top:8px;text-align:right;font-size:11.5px;color:#444;font-style:italic}
  .pay{margin-top:26px;background:#F4F7FE;border:1px solid #DCE6FB;border-radius:12px;padding:14px;font-size:12px}
  .pay b{color:#1E3A8A}
  .sign{margin-top:30px}
  .sign .siglab{font-size:11px;color:#6B7280;margin-bottom:6px}
  .sign .sigbox{width:280px;height:92px;border:1px dashed rgba(10,10,10,.28);border-radius:10px}
  .mention{margin-top:14px;font-size:12px;color:#444;font-style:italic}
  .foot{margin-top:28px;border-top:1px solid rgba(10,10,10,.1);padding-top:12px;font-size:10.5px;color:#888;line-height:1.6}
  @media print{body{padding:24px}}
</style></head><body>
  <div class="bar"></div>
  ${stamp}
  <div class="top">
    <div>
      ${logoHtml}
      <div class="em">${esc(e.adresse || "")}${e.siret ? `<br>SIRET : ${esc(e.siret)}` : ""}${e.tvaIntra && inv.vat_enabled ? `<br>TVA : ${esc(e.tvaIntra)}` : ""}${e.email ? `<br>${esc(e.email)}` : ""}${e.tel ? ` · ${esc(e.tel)}` : ""}</div>
    </div>
    <div class="doc">
      <h1>${title}</h1>
      <div class="meta">${meta}</div>
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
  ${lettres}
  ${vatMention}
  ${bottom}

  <div class="foot">${foot}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
</body></html>`;
}
