"use client";

import { useState, type ReactNode } from "react";
import { Target, Wallet, ShieldCheck, Gauge, Rocket, AlertTriangle, CheckCircle2, MapPin, FileDown, TrendingUp } from "lucide-react";

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
};
const METIERS: Record<Metier, Vocab> = {
  audio: {
    label: "Audioprothésiste", objectif: "RDV de bilan visés / mois",
    vente: "appareillage", ventes: "appareillages",
    premiumLabel: "Part de Classe 2 (premium)", margePremiumLabel: "Marge moyenne Classe 2",
    margeBaseLabel: "Marge moyenne Classe 1 (100% Santé)", margeUnit: "/ appareillage",
    audienceLabel: "Population 55 ans et + ciblable",
    partPremium: 50, margePremium: 1500, margeBase: 300,
  },
  optique: {
    label: "Opticien", objectif: "RDV / visites visés / mois",
    vente: "équipement", ventes: "équipements",
    premiumLabel: "Part d'équipements premium", margePremiumLabel: "Marge moyenne premium",
    margeBaseLabel: "Marge moyenne entrée de gamme", margeUnit: "/ équipement",
    audienceLabel: "Population ciblable (zone)",
    partPremium: 40, margePremium: 280, margeBase: 90,
  },
  dentaire: {
    label: "Cabinet dentaire", objectif: "Nouveaux patients visés / mois",
    vente: "traitement", ventes: "traitements",
    premiumLabel: "Part de soins / prothèses", margePremiumLabel: "Marge moyenne prothèse / implant",
    margeBaseLabel: "Marge moyenne soins courants", margeUnit: "/ patient",
    audienceLabel: "Population ciblable (zone)",
    partPremium: 30, margePremium: 1200, margeBase: 150,
  },
};

type Assum = { cpl: number; leadToRdv: number; presence: number; closing: number };
type Ctx = {
  mode: "objectif" | "budget";
  targetRdv: number; budget: number;
  marge: number; fee: number;
  ceiling: number; period: "apprentissage" | "regime";
};

const satMult = (u: number) => (u <= 1 ? 1 : 1 + (u - 1) * 0.6);

function compute(a: Assum, c: Ctx) {
  const cplMult = c.period === "apprentissage" ? 1.35 : 1;
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

  const [centreName, setCentreName] = useState("");

  const V = METIERS[metier];

  const applyMetier = (m: Metier) => {
    const v = METIERS[m];
    setMetier(m);
    setPartC2(v.partPremium); setMargeC2(v.margePremium); setMargeC1(v.margeBase);
  };
  const applyScenario = (k: ScenKey) => {
    const s = SCENARIOS[k];
    setCpl(s.cpl); setLeadToRdv(s.leadToRdv); setPresence(s.presence); setClosing(s.closing);
    setScenario(k);
  };
  const A = (setter: (n: number) => void) => (n: number) => { setter(n); setScenario(null); };

  const blendedMarge = (partC2 / 100) * margeC2 + (1 - partC2 / 100) * margeC1;
  const ceiling = pop55 * 0.005;

  const ctx: Ctx = { mode, targetRdv, budget, marge: blendedMarge, fee, ceiling, period };
  const cur: Assum = { cpl, leadToRdv, presence, closing };

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

  // viabilité
  const viab = r.leads >= 30
    ? { c: "emerald", t: "Budget viable", d: "Assez de volume pour que Meta apprenne et se stabilise." }
    : r.leads >= 15
    ? { c: "amber", t: "Budget un peu juste", d: "Sortie de phase d'apprentissage lente, résultats instables au début." }
    : { c: "red", t: "Budget trop faible", d: "Pas assez de signal : Meta n'optimise pas, rendement aléatoire." };
  const minBudget = 30 * cpl;

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

  // ---- Mini graphe projection 12 mois (SVG) ----
  const CW = 560, CH = 150, PADL = 8, PADR = 8, PADT = 14, PADB = 18;
  const minV = Math.min(0, ...cumProfit), maxV = Math.max(0, ...cumProfit);
  const xAt = (i: number) => PADL + (i / 11) * (CW - PADL - PADR);
  const yAt = (v: number) => {
    const t = (v - minV) / ((maxV - minV) || 1);
    return PADT + (1 - t) * (CH - PADT - PADB);
  };
  const linePath = cumProfit.map((v, i) => `${i ? "L" : "M"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xAt(11).toFixed(1)} ${yAt(minV).toFixed(1)} L ${xAt(0).toFixed(1)} ${yAt(minV).toFixed(1)} Z`;

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
            <p className="text-xs text-mut">{scenario ? `Réglage « ${SCENARIOS[scenario].label} »` : "Réglage personnalisé"} — montre le bas de la fourchette au client, jamais le haut.</p>
          </div>
          <div className="inline-flex gap-2">
            {(Object.keys(SCENARIOS) as ScenKey[]).map((k) => (
              <button key={k} onClick={() => applyScenario(k)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${scenario === k ? "border-accent bg-accent text-white" : "border-line text-mut hover:border-accent"}`}>
                {scenIcons[k]} {SCENARIOS[k].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Réglages */}
        <div className="space-y-6">
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
          </div>

          <div className={card}>
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold"><MapPin size={16} className="text-accent" /> Zone du centre</h2>
            <p className="mb-4 text-xs text-mut">Plafond estimé : ~<b className="text-ink">{num(ceiling)}</b> leads/mois absorbables avant saturation</p>
            <Slider label={V.audienceLabel} value={pop55} set={setPop55} min={1500} max={80000} step={500} />
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-6">
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
            <p className="mb-3 text-xs text-mut">Profit net cumulé (les 2 premiers mois d'apprentissage coûtent, puis ça décolle).</p>
            <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" role="img" aria-label="Courbe de profit cumulé sur 12 mois">
              <line x1={PADL} y1={yAt(0)} x2={CW - PADR} y2={yAt(0)} stroke="rgba(10,10,10,0.18)" strokeWidth="1" strokeDasharray="3 3" />
              <path d={areaPath} fill="rgba(37,99,235,0.10)" />
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

          {/* à présenter + export */}
          <div className="rounded-2xl border border-line bg-[#081434] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CC2FF]">À présenter au client</p>
            <p className="mt-3 text-[15px] leading-relaxed">
              Budget pub recommandé : <b>{eur(r.budgetPub)}/mois</b> (versé à Meta) + honoraires Neela : <b>{eur(fee)}/mois</b>.
              Résultat visé : <b>~{num(r.rdv)} RDV</b>, <b>~{num1(r.ventes)} {V.ventes}</b>, soit <b>~{eur(r.margeGen)}</b> de marge.
              {" "}Rentable dès <b>{Math.ceil(r.breakEven)}</b> ventes, retour <b>×{num1(r.roas)}</b>
              {paybackIdx >= 0 ? <>, investissement récupéré au <b>mois {paybackIdx + 1}</b>.</> : "."}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value=""
                onChange={(e) => e.target.value && setCentreName(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
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
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 outline-none"
              />
              <button
                onClick={exportProposal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <FileDown size={16} /> Exporter la proposition
              </button>
            </div>
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
