"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Target, Wallet, ShieldCheck, Gauge, Rocket, AlertTriangle, CheckCircle2, MapPin, FileDown, TrendingUp, Sliders, Layers, Search, Sparkles, FileText } from "lucide-react";

type Commune = { nom: string; codeDepartement: string; departement?: { nom: string; code: string }; population: number };

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";
const num = (n: number) => Math.round(n).toLocaleString("fr-FR");
const num1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

type ScenKey = "prudent" | "realiste" | "optimiste";
const SCENARIOS: Record<ScenKey, { cpl: number; leadToRdv: number; presence: number; closing: number; label: string }> = {
  prudent:   { cpl: 18, leadToRdv: 25, presence: 65, closing: 20, label: "Prudent" },
  realiste:  { cpl: 14, leadToRdv: 35, presence: 70, closing: 25, label: "Réaliste" },
  optimiste: { cpl: 10, leadToRdv: 45, presence: 80, closing: 33, label: "Optimiste" },
};

// Presets par métier : seulement l'économie + le vocabulaire changent
// (les hypothèses pub restent pilotées par les scénarios, universelles).
type Metier = "audio" | "optique" | "dentaire";
type Vocab = {
  label: string; objectif: string; vente: string; ventes: string;
  premiumLabel: string; margePremiumLabel: string; margeBaseLabel: string;
  margeUnit: string; audienceLabel: string;
  partPremium: number; margePremium: number; margeBase: number;
  share: number; density: number; adKeyword: string;
  adCpl: number; adLeadToRdv: number; adPresence: number; adClosing: number;
};
const METIERS: Record<Metier, Vocab> = {
  audio: {
    label: "Audioprothésiste", objectif: "RDV de bilan visés / mois",
    vente: "appareillage", ventes: "appareillages",
    premiumLabel: "Part de Classe 2 (premium)", margePremiumLabel: "Marge moyenne Classe 2",
    margeBaseLabel: "Marge moyenne Classe 1 (100% Santé)", margeUnit: "/ appareillage",
    audienceLabel: "Population 55 ans et + ciblable",
    partPremium: 50, margePremium: 1500, margeBase: 300,
    share: 0.31, density: 16000, adKeyword: "audioprothésiste",
    adCpl: 14, adLeadToRdv: 35, adPresence: 70, adClosing: 25,
  },
  optique: {
    label: "Opticien", objectif: "RDV / visites visés / mois",
    vente: "équipement", ventes: "équipements",
    premiumLabel: "Part d'équipements premium", margePremiumLabel: "Marge moyenne premium",
    margeBaseLabel: "Marge moyenne entrée de gamme", margeUnit: "/ équipement",
    audienceLabel: "Population ciblable (zone)",
    partPremium: 40, margePremium: 280, margeBase: 90,
    share: 0.55, density: 6000, adKeyword: "opticien",
    adCpl: 9, adLeadToRdv: 40, adPresence: 75, adClosing: 30,
  },
  dentaire: {
    label: "Cabinet dentaire", objectif: "Nouveaux patients visés / mois",
    vente: "traitement", ventes: "traitements",
    premiumLabel: "Part de soins / prothèses", margePremiumLabel: "Marge moyenne prothèse / implant",
    margeBaseLabel: "Marge moyenne soins courants", margeUnit: "/ patient",
    audienceLabel: "Population ciblable (zone)",
    partPremium: 30, margePremium: 1200, margeBase: 150,
    share: 0.50, density: 1700, adKeyword: "dentiste",
    adCpl: 12, adLeadToRdv: 30, adPresence: 72, adClosing: 28,
  },
};

type Assum = { cpl: number; leadToRdv: number; presence: number; closing: number };
type Ctx = {
  mode: "objectif" | "budget";
  targetRdv: number; budget: number;
  marge: number; fee: number;
  ceiling: number; period: "apprentissage" | "regime";
  compMult: number;
};

const satMult = (u: number) => (u <= 1 ? 1 : 1 + (u - 1) * 0.6);

function compute(a: Assum, c: Ctx) {
  const cplMult = (c.period === "apprentissage" ? 1.35 : 1) * c.compMult;
  const convMult = c.period === "apprentissage" ? 0.8 : 1;
  const l2r = (a.leadToRdv / 100) * convMult;
  const pres = a.presence / 100, cl = a.closing / 100;

  let leads: number, budgetPub: number, rdv: number, effCpl: number;
  if (c.mode === "objectif") {
    rdv = c.targetRdv;
    leads = l2r > 0 ? rdv / l2r : 0;
    const util = c.ceiling > 0 ? leads / c.ceiling : 0;
    effCpl = a.cpl * cplMult * satMult(util);
    budgetPub = leads * effCpl;
  } else {
    budgetPub = c.budget;
    effCpl = a.cpl * cplMult;
    for (let i = 0; i < 5; i++) {
      const lds = budgetPub / effCpl;
      const util = c.ceiling > 0 ? lds / c.ceiling : 0;
      effCpl = a.cpl * cplMult * satMult(util);
    }
    leads = budgetPub / effCpl;
    rdv = leads * l2r;
  }
  const util = c.ceiling > 0 ? leads / c.ceiling : 0;
  const presents = rdv * pres;
  const ventes = presents * cl;
  const margeGen = ventes * c.marge;
  const coutParRdv = rdv > 0 ? budgetPub / rdv : 0;
  const totalCost = budgetPub + c.fee;
  const roas = totalCost > 0 ? margeGen / totalCost : 0;
  const profit = margeGen - totalCost;
  const breakEven = c.marge > 0 ? totalCost / c.marge : 0;
  return { leads, budgetPub, rdv, presents, ventes, margeGen, coutParRdv, totalCost, roas, profit, util, effCpl, breakEven };
}

function Slider({
  label, value, set, min, max, step = 1, suffix = "",
}: { label: string; value: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-display text-sm font-bold text-accent">{value.toLocaleString("fr-FR")}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-accent" />
    </div>
  );
}

export default function AdPlanner({ centres = [] }: { centres?: { nom: string; ville: string | null }[] }) {
  const sp = useSearchParams(); // liaison interne : ?ville=&centre= (depuis une fiche prospect)
  const [mode, setMode] = useState<"objectif" | "budget">("objectif");
  const [targetRdv, setTargetRdv] = useState(20);
  const [budget, setBudget] = useState(1000);
  const [period, setPeriod] = useState<"apprentissage" | "regime">("regime");

  const [metier, setMetier] = useState<Metier>("audio");
  const [scenario, setScenario] = useState<ScenKey | null>("realiste");
  const [cpl, setCpl] = useState(SCENARIOS.realiste.cpl);
  const [leadToRdv, setLeadToRdv] = useState(SCENARIOS.realiste.leadToRdv);
  const [presence, setPresence] = useState(SCENARIOS.realiste.presence);
  const [closing, setClosing] = useState(SCENARIOS.realiste.closing);

  const [partC2, setPartC2] = useState(METIERS.audio.partPremium);
  const [margeC2, setMargeC2] = useState(METIERS.audio.margePremium);
  const [margeC1, setMargeC1] = useState(METIERS.audio.margeBase);
  const [fee, setFee] = useState(990);
  const [pop55, setPop55] = useState(12000);

  const [centreName, setCentreName] = useState(sp.get("centre") ?? "");

  const [cityQuery, setCityQuery] = useState(sp.get("ville") ?? "");
  const [citySug, setCitySug] = useState<Commune[]>([]);
  const [city, setCity] = useState<Commune | null>(null);
  const [compLevel, setCompLevel] = useState<"faible" | "moyenne" | "forte">("moyenne");
  const [autoActive, setAutoActive] = useState(false);

  const V = METIERS[metier];

  const applyMetier = (m: Metier) => {
    const v = METIERS[m];
    setMetier(m);
    setPartC2(v.partPremium); setMargeC2(v.margePremium); setMargeC1(v.margeBase);
    setAutoActive(false);
  };
  const applyScenario = (k: ScenKey) => {
    const s = SCENARIOS[k];
    setCpl(s.cpl); setLeadToRdv(s.leadToRdv); setPresence(s.presence); setClosing(s.closing);
    setScenario(k); setAutoActive(false);
  };
  const A = (setter: (n: number) => void) => (n: number) => { setter(n); setScenario(null); setAutoActive(false); };

  const blendedMarge = (partC2 / 100) * margeC2 + (1 - partC2 / 100) * margeC1;
  const ceiling = pop55 * 0.005;

  // Zone géographique (depuis la ville sélectionnée)
  const scopedPop = city?.population ?? 0;
  const estPop = Math.round(scopedPop * V.share);
  const estCompetitors = scopedPop ? Math.max(1, Math.round(scopedPop / V.density)) : 0;
  const applyZone = () => { if (estPop) setPop55(Math.min(200000, Math.max(1500, Math.round(estPop / 1000) * 1000))); };

  // Concurrence → multiplicateur de CPL
  const compMult = compLevel === "faible" ? 0.9 : compLevel === "forte" ? 1.25 : 1;

  // Lien vers la bibliothèque publicitaire Meta (pré-remplie)
  const adKw = `${V.adKeyword} ${city?.nom || cityQuery.trim()}`.trim();
  const adLibUrl = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&media_type=all&q=${encodeURIComponent(adKw)}&search_type=keyword_unordered`;

  // Autocomplétion ville via l'API publique geo.api.gouv.fr (gratuite, sans clé).
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2 || (city && city.nom.toLowerCase() === q.toLowerCase())) { setCitySug([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,codeDepartement,departement,population&boost=population&limit=6`);
        const data = await res.json();
        setCitySug(Array.isArray(data) ? data.filter((c: Commune) => c.population) : []);
      } catch {
        setCitySug([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [cityQuery, city]);

  const ctx: Ctx = { mode, targetRdv, budget, marge: blendedMarge, fee, ceiling, period, compMult };
  const cur: Assum = { cpl, leadToRdv, presence, closing };

  // Mode auto : règle hypothèses pub + économie + concurrence au plus réaliste
  // selon le métier et la densité de la zone (ville sélectionnée).
  function autoOptimize() {
    const v = METIERS[metier];
    let cplAdj = 1;
    let level: "faible" | "moyenne" | "forte" = "moyenne";
    if (city) {
      if (scopedPop > 150000) { cplAdj = 1.2; level = "forte"; }
      else if (scopedPop > 40000) { cplAdj = 1; level = "moyenne"; }
      else { cplAdj = 0.85; level = "faible"; }
    }
    const newCpl = Math.round(v.adCpl * cplAdj);
    const newPop = city && estPop ? Math.min(200000, Math.max(1500, Math.round(estPop / 1000) * 1000)) : pop55;
    const compM = level === "faible" ? 0.9 : level === "forte" ? 1.25 : 1;
    const newMarge = (v.partPremium / 100) * v.margePremium + (1 - v.partPremium / 100) * v.margeBase;
    const tmp = compute(
      { cpl: newCpl, leadToRdv: v.adLeadToRdv, presence: v.adPresence, closing: v.adClosing },
      { ...ctx, marge: newMarge, ceiling: newPop * 0.005, compMult: compM }
    );
    const newFee = Math.round(Math.min(2500, Math.max(600, 0.25 * tmp.margeGen)) / 10) * 10;

    setCpl(newCpl); setLeadToRdv(v.adLeadToRdv); setPresence(v.adPresence); setClosing(v.adClosing);
    setPartC2(v.partPremium); setMargeC2(v.margePremium); setMargeC1(v.margeBase);
    setPop55(newPop); setCompLevel(level); setFee(newFee);
    setScenario(null); setAutoActive(true);
  }

  const r = compute(cur, ctx);
  const rP = compute(SCENARIOS.prudent, ctx);
  const rO = compute(SCENARIOS.optimiste, ctx);
  const band = (sel: (x: ReturnType<typeof compute>) => number) => {
    const a = sel(rP), b = sel(rO);
    return [Math.min(a, b), Math.max(a, b)] as const;
  };

  // ---- Projection 12 mois (budget mensuel constant = budget de régime) ----
  const regimeBudget = mode === "budget" ? budget : compute(cur, { ...ctx, mode: "objectif", period: "regime" }).budgetPub;
  const months = Array.from({ length: 12 }, (_, i) =>
    compute(cur, { ...ctx, mode: "budget", budget: regimeBudget, period: i < 2 ? "apprentissage" : "regime" })
  );
  let acc = 0;
  const cumProfit = months.map((m) => (acc += m.profit));
  const paybackIdx = cumProfit.findIndex((v) => v >= 0);
  const cum12 = cumProfit[11];

  // Bande de confiance : profit cumulé prudent ↔ optimiste, à budget mensuel constant.
  const cumForAssum = (assum: Assum) => {
    let a = 0;
    return cumProfit.map((_, i) =>
      (a += compute(assum, { ...ctx, mode: "budget", budget: regimeBudget, period: i < 2 ? "apprentissage" : "regime" }).profit)
    );
  };
  const cumLow = cumForAssum(SCENARIOS.prudent);
  const cumHigh = cumForAssum(SCENARIOS.optimiste);

  // Optimiseur de budget : profit mensuel (régime) selon le budget pub.
  const sweep: { b: number; p: number }[] = [];
  for (let b = 300; b <= 5000; b += 100) {
    sweep.push({ b, p: compute(cur, { ...ctx, mode: "budget", budget: b, period: "regime" }).profit });
  }
  const best = sweep.reduce((a, c) => (c.p > a.p ? c : a), sweep[0]);

  // 3 paliers d'offre, dérivés du budget de régime.
  const baseB = Math.max(300, Math.round(regimeBudget / 50) * 50);
  const tiers = [
    { name: "Essentiel", b: Math.max(300, Math.round((baseB * 0.7) / 50) * 50), reco: false },
    { name: "Croissance", b: baseB, reco: true },
    { name: "Performance", b: Math.round((baseB * 1.6) / 50) * 50, reco: false },
  ].map((t) => ({ ...t, res: compute(cur, { ...ctx, mode: "budget", budget: t.b, period: "regime" }) }));

  // viabilité
  const viab = r.leads >= 30
    ? { c: "emerald", t: "Budget viable", d: "Assez de volume pour que Meta apprenne et se stabilise." }
    : r.leads >= 15
    ? { c: "amber", t: "Budget un peu juste", d: "Sortie de phase d'apprentissage lente, résultats instables au début." }
    : { c: "red", t: "Budget trop faible", d: "Pas assez de signal : Meta n'optimise pas, rendement aléatoire." };
  const minBudget = 30 * cpl;

  // Honoraires recommandés (rester concurrentiel) : ~25 % de la marge générée, bornés.
  const feeReco = Math.round(Math.min(2500, Math.max(600, 0.25 * r.margeGen)) / 10) * 10;
  const feeLow = Math.round(Math.max(500, 0.18 * r.margeGen) / 10) * 10;
  const feeHigh = Math.round(Math.min(3000, 0.3 * r.margeGen) / 10) * 10;

  const zone = r.util <= 0.7
    ? { c: "emerald", t: "Zone confortable" }
    : r.util <= 1
    ? { c: "amber", t: "Zone bien exploitée" }
    : { c: "red", t: "Zone saturée — le CPL grimpe" };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const funnel = [
    { l: "Leads", v: r.leads },
    { l: "RDV", v: r.rdv },
    { l: "Présents", v: r.presents },
    { l: cap(V.ventes), v: r.ventes },
  ];
  const fmax = Math.max(1, r.leads);
  const card = "rounded-2xl border border-line bg-white p-5";
  const scenIcons: Record<ScenKey, ReactNode> = {
    prudent: <ShieldCheck size={15} />, realiste: <Gauge size={15} />, optimiste: <Rocket size={15} />,
  };
  const tone: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  // ---- Export proposition (page imprimable / PDF) ----
  function exportProposal() {
    const nom = centreName.trim() || "votre centre";
    const tiersRows = tiers
      .map((t) => `<tr><td>${t.name}${t.reco ? " ★" : ""} — ${eur(t.b)}/mois pub</td><td>${num(t.res.rdv)} RDV · ${eur(t.res.margeGen)} marge · ×${num1(t.res.roas)}</td></tr>`)
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Proposition Neela — ${nom}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0A0A0A;padding:48px;max-width:780px;margin:auto;line-height:1.5}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;letter-spacing:-.02em}
  .dot{width:11px;height:11px;border-radius:50%;background:#2563EB;display:inline-block}
  h1{font-size:30px;letter-spacing:-.03em;margin:28px 0 6px}
  .sub{color:#6B7280;font-size:15px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin:28px 0}
  .kpi{border:1px solid rgba(10,10,10,.1);border-radius:16px;padding:18px}
  .kpi .v{font-size:26px;font-weight:800;letter-spacing:-.02em}
  .kpi .l{color:#6B7280;font-size:12px;margin-top:4px}
  .accent{color:#2563EB}.green{color:#059669}
  .panel{background:#081434;color:#fff;border-radius:18px;padding:24px;margin:24px 0;line-height:1.6;font-size:15px}
  .panel b{color:#9CC2FF}
  table{width:100%;border-collapse:collapse;margin:8px 0 0}
  td{padding:9px 0;border-bottom:1px solid rgba(10,10,10,.08);font-size:14px}
  td:last-child{text-align:right;font-weight:700}
  .foot{color:#9AA0AA;font-size:11px;margin-top:30px;border-top:1px solid rgba(10,10,10,.1);padding-top:14px}
  @media print{body{padding:24px}.noprint{display:none}}
</style></head><body>
  <div class="brand"><span class="dot"></span> Neela</div>
  <h1>Proposition d'acquisition — ${nom}</h1>
  <p class="sub">Campagnes Meta Ads pilotées · ${V.label} · estimation indicative (fourchette basse)</p>

  <div class="grid">
    <div class="kpi"><div class="v accent">${eur(r.budgetPub)}</div><div class="l">Budget pub / mois (versé à Meta)</div></div>
    <div class="kpi"><div class="v">${num(r.rdv)}</div><div class="l">${cap(V.objectif.split(" ")[0])} estimés / mois</div></div>
    <div class="kpi"><div class="v green">×${num1(r.roas)}</div><div class="l">Retour par € investi</div></div>
  </div>

  <table>
    <tr><td>Honoraires Neela / mois</td><td>${eur(fee)}</td></tr>
    <tr><td>${cap(V.ventes)} attendus / mois</td><td>${num1(r.ventes)}</td></tr>
    <tr><td>Marge générée / mois</td><td>${eur(r.margeGen)}</td></tr>
    <tr><td>Rentable dès</td><td>${Math.ceil(r.breakEven)} ${V.ventes}</td></tr>
    <tr><td>Investissement récupéré</td><td>${paybackIdx >= 0 ? "mois " + (paybackIdx + 1) : "au-delà de 12 mois"}</td></tr>
    <tr><td>Profit net cumulé à 12 mois</td><td>${eur(cum12)}</td></tr>
  </table>

  <h3 style="font-size:16px;margin:24px 0 6px">3 formules au choix</h3>
  <table>${tiersRows}</table>

  <div class="panel">
    Budget pub recommandé : <b>${eur(r.budgetPub)}/mois</b> + honoraires Neela <b>${eur(fee)}/mois</b>.
    Objectif : <b>~${num(r.rdv)}</b> rendez-vous et <b>~${num1(r.ventes)} ${V.ventes}</b> par mois,
    soit <b>~${eur(r.margeGen)}</b> de marge. Investissement remboursé ${paybackIdx >= 0 ? "dès le <b>mois " + (paybackIdx + 1) + "</b>" : "progressivement"}.
  </div>

  <p class="foot">Estimations indicatives à but de planification (Meta = leads plus froids que Google ; plafonds et taux = heuristiques). Aucun nombre de rendez-vous n'est garanti contractuellement hors offre dédiée. Neela — ${new Date().toLocaleDateString("fr-FR")}.</p>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
</body></html>`;
    const w = window.open("", "_blank", "width=840,height=1000");
    if (!w) { alert("Autorise les fenêtres pop-up pour exporter la proposition."); return; }
    w.document.write(html);
    w.document.close();
  }

  // ---- Mini graphe projection 12 mois (SVG) avec bande de confiance ----
  const CW = 560, CH = 150, PADL = 8, PADR = 8, PADT = 14, PADB = 18;
  const cvals = [0, ...cumProfit, ...cumLow, ...cumHigh];
  const minV = Math.min(...cvals), maxV = Math.max(...cvals);
  const xAt = (i: number) => PADL + (i / 11) * (CW - PADL - PADR);
  const yAt = (v: number) => PADT + (1 - (v - minV) / ((maxV - minV) || 1)) * (CH - PADT - PADB);
  const linePath = cumProfit.map((v, i) => `${i ? "L" : "M"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");
  const bandTop = cumHigh.map((v, i) => `${i ? "L" : "M"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");
  const bandPath = bandTop + " " + cumLow.map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `L ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ") + " Z";

  // ---- Échelles de l'optimiseur de budget ----
  const OW = 560, OH = 120, OPL = 8, OPR = 8, OPT = 12, OPB = 18;
  const oMin = Math.min(0, ...sweep.map((s) => s.p)), oMax = Math.max(0, ...sweep.map((s) => s.p));
  const oX = (b: number) => OPL + ((b - 300) / (5000 - 300)) * (OW - OPL - OPR);
  const oY = (p: number) => OPT + (1 - (p - oMin) / ((oMax - oMin) || 1)) * (OH - OPT - OPB);
  const oPath = sweep.map((s, i) => `${i ? "L" : "M"} ${oX(s.b).toFixed(1)} ${oY(s.p).toFixed(1)}`).join(" ");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Ad Planner</h1>
        <p className="mt-1 text-sm text-mut">Simule le budget Meta Ads, la rentabilité et le bon compromis pour chaque centre.</p>
      </div>

      {/* Métier + Mode + période */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          {(Object.keys(METIERS) as Metier[]).map((m) => (
            <button key={m} onClick={() => applyMetier(m)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ${metier === m ? "bg-accent text-white" : "text-mut hover:text-ink"}`}>
              {METIERS[m].label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          <button onClick={() => setMode("objectif")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${mode === "objectif" ? "bg-ink text-paper" : "text-mut"}`}>
            <Target size={16} /> Partir d'un objectif
          </button>
          <button onClick={() => setMode("budget")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${mode === "budget" ? "bg-ink text-paper" : "text-mut"}`}>
            <Wallet size={16} /> Partir d'un budget
          </button>
        </div>
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          <button onClick={() => setPeriod("regime")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${period === "regime" ? "bg-ink text-paper" : "text-mut"}`}>Régime établi</button>
          <button onClick={() => setPeriod("apprentissage")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${period === "apprentissage" ? "bg-ink text-paper" : "text-mut"}`}>Mois 1-2 (apprentissage)</button>
        </div>
      </div>

      {/* Scénario */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Scénario d'hypothèses</p>
            <p className="text-xs text-mut">
              {autoActive ? "Réglage automatique optimisé (zone + métier)" : scenario ? `Réglage « ${SCENARIOS[scenario].label} »` : "Réglage personnalisé"} — montre le bas de la fourchette au client, jamais le haut.
            </p>
          </div>
          <div className="inline-flex flex-wrap items-center gap-2">
            <button onClick={autoOptimize} title="Régler automatiquement selon le métier et la zone sélectionnée"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${autoActive ? "border-accent bg-accent text-white" : "border-accent text-accent hover:bg-accent hover:text-white"}`}>
              <Sparkles size={14} /> Auto
            </button>
            <span className="mx-0.5 hidden h-4 w-px bg-line sm:block" />
            {(Object.keys(SCENARIOS) as ScenKey[]).map((k) => (
              <button key={k} onClick={() => applyScenario(k)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${scenario === k ? "border-accent bg-accent text-white" : "border-line text-mut hover:border-accent"}`}>
                {scenIcons[k]} {SCENARIOS[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Réglages */}
        <div className="min-w-0 space-y-6">
          <div className={card}>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold"><MapPin size={16} className="text-accent" /> Zone &amp; concurrence</h2>

            <div className="relative">
              <input value={cityQuery} onChange={(e) => { setCityQuery(e.target.value); setCity(null); }}
                placeholder="Ville du centre (ex. La Rochelle)"
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent" />
              {citySug.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
                  {citySug.map((c) => (
                    <button key={`${c.nom}-${c.codeDepartement}`} onClick={() => { setCity(c); setCityQuery(c.nom); setCitySug([]); }}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-paper">
                      <span className="truncate">{c.nom} <span className="text-mut">({c.codeDepartement})</span></span>
                      <span className="shrink-0 text-xs text-mut">{num(c.population)} hab.</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {city && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-paper p-3 text-xs text-mut">
                <span><b className="text-ink">{city.nom}</b>{city.departement ? ` · ${city.departement.nom}` : ""} · <b className="text-ink">{num(scopedPop)}</b> hab. · cible <b className="text-ink">{num(estPop)}</b> · ~<b className="text-ink">{estCompetitors}</b> concurrents</span>
                <button onClick={applyZone} className="ml-auto rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">Appliquer</button>
              </div>
            )}

            <div className="mt-4">
              <Slider label={V.audienceLabel} value={pop55} set={setPop55} min={1500} max={200000} step={1000} />
              <p className="mt-2 text-xs text-mut">Plafond estimé : ~<b className="text-ink">{num(ceiling)}</b> leads/mois avant saturation</p>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-ink">Intensité concurrentielle</p>
              <div className="mt-2 flex gap-2">
                {(["faible", "moyenne", "forte"] as const).map((l) => (
                  <button key={l} onClick={() => setCompLevel(l)}
                    className={`flex-1 rounded-full border px-2 py-1.5 text-xs font-semibold capitalize ${compLevel === l ? "border-accent bg-accent text-white" : "border-line text-mut hover:border-accent"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-mut">Impact sur le CPL : <b className="text-ink">×{num1(compMult)}</b>{estCompetitors > 0 && <> · ~{estCompetitors} concurrents dans la zone</>}</p>
            </div>

            <div className="mt-4">
              <a href={adLibUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent">
                <Search size={15} /> Voir les pubs Meta de la zone
              </a>
              <p className="mt-1.5 text-[11px] text-mut">Ouvre la bibliothèque publicitaire officielle Meta, pré-remplie ({V.adKeyword} {city?.nom || cityQuery || "…"}).</p>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-4 font-display text-base font-bold">{mode === "objectif" ? "Ton objectif" : "Le budget pub"}</h2>
            {mode === "objectif"
              ? <Slider label={V.objectif} value={targetRdv} set={setTargetRdv} min={5} max={60} />
              : <Slider label="Budget pub mensuel (versé à Meta)" value={budget} set={setBudget} min={300} max={5000} step={50} suffix=" €" />}
          </div>

          <div className={card}>
            <h2 className="mb-4 font-display text-base font-bold">Hypothèses publicité (ajustables)</h2>
            <div className="space-y-4">
              <Slider label="Coût par lead (CPL)" value={cpl} set={A(setCpl)} min={4} max={40} suffix=" €" />
              <Slider label="Taux lead → RDV" value={leadToRdv} set={A(setLeadToRdv)} min={15} max={80} suffix=" %" />
              <Slider label="Taux de présence au RDV" value={presence} set={A(setPresence)} min={50} max={95} suffix=" %" />
              <Slider label={`Taux RDV → ${V.vente}`} value={closing} set={A(setClosing)} min={10} max={60} suffix=" %" />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-1 font-display text-base font-bold">Économie du centre</h2>
            <p className="mb-4 text-xs text-mut">Marge mixte estimée : <b className="text-ink">{eur(blendedMarge)}</b> {V.margeUnit}</p>
            <div className="space-y-4">
              <Slider label={V.premiumLabel} value={partC2} set={setPartC2} min={0} max={100} suffix=" %" />
              <Slider label={V.margePremiumLabel} value={margeC2} set={setMargeC2} min={50} max={3000} step={50} suffix=" €" />
              <Slider label={V.margeBaseLabel} value={margeC1} set={setMargeC1} min={0} max={1000} step={25} suffix=" €" />
              <Slider label="Tes honoraires / mois" value={fee} set={setFee} min={300} max={3000} step={10} suffix=" €" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs">
              <span className="text-mut">Honoraires recommandés pour rester concurrentiel : <b className="text-ink">{eur(feeReco)}</b> · fourchette {eur(feeLow)}–{eur(feeHigh)}</span>
              <button onClick={() => setFee(feeReco)} className="ml-auto rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">Appliquer</button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="min-w-0 space-y-6">
          {/* viabilité */}
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${tone[viab.c]}`}>
            {viab.c === "emerald" ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
            <div>
              <p className="text-sm font-bold">{viab.t} · ~{num(r.leads)} leads/mois</p>
              <p className="text-xs opacity-90">{viab.d} Budget minimum conseillé : <b>{eur(minBudget)}/mois</b> (≈ 30 leads).</p>
            </div>
          </div>

          {/* KPI + fourchette */}
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              const cards = mode === "objectif"
                ? [
                    { lab: "Budget pub / mois", main: eur(r.budgetPub), b: band((x) => x.budgetPub).map(eur), cls: "text-accent" },
                    { lab: "Marge générée (client)", main: eur(r.margeGen), b: band((x) => x.margeGen).map(eur), cls: "" },
                    { lab: "Retour / € investi", main: "×" + num1(r.roas), b: band((x) => x.roas).map((v) => "×" + num1(v)), cls: "text-emerald-600" },
                  ]
                : [
                    { lab: "RDV attendus / mois", main: num(r.rdv), b: band((x) => x.rdv).map(num), cls: "text-accent" },
                    { lab: "Marge générée (client)", main: eur(r.margeGen), b: band((x) => x.margeGen).map(eur), cls: "" },
                    { lab: "Retour / € investi", main: "×" + num1(r.roas), b: band((x) => x.roas).map((v) => "×" + num1(v)), cls: "text-emerald-600" },
                  ];
              return cards.map((c) => (
                <div key={c.lab} className="rounded-2xl border border-line bg-white p-4">
                  <p className={`font-display text-2xl font-bold ${c.cls}`}>{c.main}</p>
                  <p className="mt-1 text-[11px] font-medium text-mut">{c.lab}</p>
                  <p className="mt-1 text-[10px] text-mut">fourchette : {c.b[0]} – {c.b[1]}</p>
                </div>
              ));
            })()}
          </div>

          {/* Projection 12 mois */}
          <div className={card}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold"><TrendingUp size={16} className="text-accent" /> Projection 12 mois</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${paybackIdx >= 0 ? tone.emerald : tone.amber}`}>
                {paybackIdx >= 0 ? `Rentabilisé au mois ${paybackIdx + 1}` : "Payback > 12 mois"}
              </span>
            </div>
            <p className="mb-3 text-xs text-mut">Profit net cumulé (les 2 premiers mois d'apprentissage coûtent, puis ça décolle). La zone bleue = fourchette prudent → optimiste.</p>
            <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" role="img" aria-label="Courbe de profit cumulé sur 12 mois avec fourchette">
              <line x1={PADL} y1={yAt(0)} x2={CW - PADR} y2={yAt(0)} stroke="rgba(10,10,10,0.18)" strokeWidth="1" strokeDasharray="3 3" />
              <path d={bandPath} fill="rgba(37,99,235,0.12)" />
              <path d={linePath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {paybackIdx >= 0 && (
                <g>
                  <line x1={xAt(paybackIdx)} y1={PADT} x2={xAt(paybackIdx)} y2={CH - PADB} stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={xAt(paybackIdx)} cy={yAt(cumProfit[paybackIdx])} r="4" fill="#059669" />
                </g>
              )}
              {cumProfit.map((_, i) => (
                <text key={i} x={xAt(i)} y={CH - 4} fontSize="9" textAnchor="middle" fill="#6B7280">{i + 1}</text>
              ))}
            </svg>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span className="text-mut">Profit cumulé à 12 mois : <b className={cum12 >= 0 ? "text-emerald-600" : "text-red-600"}>{eur(cum12)}</b></span>
              <span className="text-mut">Budget mensuel projeté : <b className="text-ink">{eur(regimeBudget)}</b></span>
            </div>
          </div>

          {/* Optimiseur de budget */}
          <div className={card}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-base font-bold"><Sliders size={16} className="text-accent" /> Optimiseur de budget</h2>
              <button onClick={() => { setMode("budget"); setBudget(best.b); }}
                className="shrink-0 rounded-full border border-accent px-3 py-1 text-[11px] font-semibold text-accent hover:bg-accent hover:text-white">
                Adopter {eur(best.b)}
              </button>
            </div>
            <p className="mb-3 text-xs text-mut">Profit mensuel selon le budget. Optimum estimé : <b className="text-ink">{eur(best.b)}/mois</b> → <b className="text-emerald-600">{eur(best.p)}</b> de profit.</p>
            <svg viewBox={`0 0 ${OW} ${OH}`} className="w-full" role="img" aria-label="Profit selon le budget pub">
              <line x1={OPL} y1={oY(0)} x2={OW - OPR} y2={oY(0)} stroke="rgba(10,10,10,0.18)" strokeWidth="1" strokeDasharray="3 3" />
              <path d={oPath} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              <line x1={oX(best.b)} y1={OPT} x2={oX(best.b)} y2={OH - OPB} stroke="#059669" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx={oX(best.b)} cy={oY(best.p)} r="4" fill="#059669" />
              {[300, 1500, 3000, 5000].map((b) => (
                <text key={b} x={oX(b)} y={OH - 4} fontSize="9" textAnchor="middle" fill="#6B7280">{b >= 1000 ? b / 1000 + "k" : b}€</text>
              ))}
            </svg>
          </div>

          {/* 3 formules */}
          <div className={card}>
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold"><Layers size={16} className="text-accent" /> 3 formules à proposer</h2>
            <p className="mb-4 text-xs text-mut">Même accompagnement, plus de budget = plus de résultats. Le palier du milieu est recommandé.</p>
            <div className="grid grid-cols-3 gap-3">
              {tiers.map((t) => (
                <div key={t.name} className={`rounded-2xl border p-4 ${t.reco ? "border-accent bg-accent/5" : "border-line"}`}>
                  {t.reco && <span className="mb-2 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">Recommandé</span>}
                  <p className="font-display text-base font-bold">{t.name}</p>
                  <p className="mt-1 font-display text-xl font-bold text-accent">{eur(t.b)}<span className="text-[11px] font-medium text-mut"> /mois</span></p>
                  <ul className="mt-3 space-y-1.5 text-[12px] text-mut">
                    <li><b className="text-ink">{num(t.res.rdv)}</b> RDV/mois</li>
                    <li><b className="text-ink">{num1(t.res.ventes)}</b> {V.ventes}</li>
                    <li><b className="text-ink">{eur(t.res.margeGen)}</b> marge</li>
                    <li>Retour <b className="text-emerald-600">×{num1(t.res.roas)}</b></li>
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-mut">Honoraires Neela {eur(fee)}/mois inclus. Budgets versés à Meta.</p>
          </div>

          {/* funnel */}
          <div className={card}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Entonnoir estimé / mois</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone[zone.c]}`}>{zone.t} · {num(r.util * 100)}%</span>
            </div>
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.l} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-mut">{f.l}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-paper">
                    <div className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-accent to-[#5AA0FF] pr-2 text-[11px] font-bold text-white"
                      style={{ width: `${Math.max(6, (f.v / fmax) * 100)}%` }}>{num(f.v)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="text-mut">Coût par RDV : <b className="text-ink">{eur(r.coutParRdv)}</b></span>
              <span className="text-mut">CPL effectif : <b className="text-ink">{eur(r.effCpl)}</b></span>
            </div>
          </div>

          {/* rentabilité */}
          <div className={card}>
            <h2 className="mb-3 font-display text-base font-bold">Seuil de rentabilité</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-paper p-3">
                <p className="font-display text-xl font-bold">{Math.ceil(r.breakEven)}</p>
                <p className="text-[11px] text-mut">ventes pour rentabiliser</p>
              </div>
              <div className="rounded-xl bg-paper p-3">
                <p className="font-display text-xl font-bold">{num1(r.ventes)}</p>
                <p className="text-[11px] text-mut">ventes attendues</p>
              </div>
              <div className={`rounded-xl p-3 ${r.profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className={`font-display text-xl font-bold ${r.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{eur(r.profit)}</p>
                <p className="text-[11px] text-mut">marge nette / mois</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-mut">
              {r.ventes >= r.breakEven
                ? `Rentable dès la ${Math.ceil(r.breakEven)}ᵉ vente — l'objectif (~${num1(r.ventes)}) la dépasse.`
                : `Attention : à ces hypothèses, l'objectif (~${num1(r.ventes)} ventes) ne couvre pas encore le coût (seuil ${Math.ceil(r.breakEven)}).`}
            </p>
          </div>

          {/* Sans pub vs avec Neela */}
          <div className={card}>
            <h2 className="mb-3 font-display text-base font-bold">Sans pub vs avec Neela</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-paper p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-mut">Sans campagne</p>
                <p className="mt-2 font-display text-2xl font-bold text-mut">0</p>
                <p className="text-[12px] text-mut">RDV générés / mois</p>
                <p className="mt-2 text-[12px] text-mut">La demande part chez les concurrents.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Avec Neela</p>
                <p className="mt-2 font-display text-2xl font-bold text-emerald-700">+{num(r.rdv)}</p>
                <p className="text-[12px] text-emerald-700/80">RDV générés / mois</p>
                <p className="mt-2 text-[12px] text-emerald-700/80">+{eur(r.margeGen)} de marge / mois</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-mut">
              Chaque mois sans campagne ≈ <b className="text-ink">{eur(r.margeGen)}</b> de marge laissée à la concurrence,
              soit ~<b className="text-ink">{eur(r.margeGen * 12)}</b> sur l'année.
            </p>
          </div>

          {/* à présenter + export */}
          <div className="rounded-2xl border border-line bg-[#081434] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CC2FF]">À présenter au client</p>
            <p className="mt-3 text-[15px] leading-relaxed">
              Budget pub recommandé : <b>{eur(r.budgetPub)}/mois</b> (versé à Meta) + honoraires Neela : <b>{eur(fee)}/mois</b>.
              Résultat visé : <b>~{num(r.rdv)} RDV</b>, <b>~{num1(r.ventes)} {V.ventes}</b>, soit <b>~{eur(r.margeGen)}</b> de marge.
              {" "}Rentable dès <b>{Math.ceil(r.breakEven)}</b> ventes, retour <b>×{num1(r.roas)}</b>
              {paybackIdx >= 0 ? <>, investissement récupéré au <b>mois {paybackIdx + 1}</b>.</> : "."}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
              <select
                value=""
                onChange={(e) => e.target.value && setCentreName(e.target.value)}
                className="min-w-0 truncate rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
              >
                <option value="">Choisir un centre du CRM…</option>
                {centres.map((c) => (
                  <option key={c.nom} value={c.nom}>{c.nom}{c.ville ? ` · ${c.ville}` : ""}</option>
                ))}
              </select>
              <input
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                placeholder="ou nom du centre…"
                className="min-w-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none"
              />
              <button
                onClick={exportProposal}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <FileDown size={16} /> Exporter
              </button>
            </div>
            <Link
              href={`/crm/factures?new=1&type=devis&client=${encodeURIComponent(centreName)}&budget=${Math.round(r.budgetPub)}&fee=${fee}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <FileText size={16} /> Créer un devis depuis ces chiffres
            </Link>
          </div>

          <p className="text-xs text-mut">
            Estimations indicatives (Meta = leads plus froids que Google ; plafond de zone et seuils = heuristiques de planification).
            Présente la fourchette basse, et ne garantis jamais un nombre de RDV.
          </p>
        </div>
      </div>
    </div>
  );
}
