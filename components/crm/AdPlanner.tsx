"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Target, Wallet, ShieldCheck, Gauge, Rocket, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";
const num = (n: number) => Math.round(n).toLocaleString("fr-FR");
const num1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

type ScenKey = "prudent" | "realiste" | "optimiste";
const SCENARIOS: Record<ScenKey, { cpl: number; leadToRdv: number; presence: number; closing: number; label: string }> = {
  prudent:   { cpl: 18, leadToRdv: 25, presence: 65, closing: 20, label: "Prudent" },
  realiste:  { cpl: 14, leadToRdv: 35, presence: 70, closing: 25, label: "Réaliste" },
  optimiste: { cpl: 10, leadToRdv: 45, presence: 80, closing: 33, label: "Optimiste" },
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

export default function AdPlanner() {
  const [mode, setMode] = useState<"objectif" | "budget">("objectif");
  const [targetRdv, setTargetRdv] = useState(20);
  const [budget, setBudget] = useState(1000);
  const [period, setPeriod] = useState<"apprentissage" | "regime">("regime");

  const [scenario, setScenario] = useState<ScenKey | null>("realiste");
  const [cpl, setCpl] = useState(SCENARIOS.realiste.cpl);
  const [leadToRdv, setLeadToRdv] = useState(SCENARIOS.realiste.leadToRdv);
  const [presence, setPresence] = useState(SCENARIOS.realiste.presence);
  const [closing, setClosing] = useState(SCENARIOS.realiste.closing);

  const [partC2, setPartC2] = useState(50);
  const [margeC2, setMargeC2] = useState(1500);
  const [margeC1, setMargeC1] = useState(300);
  const [fee, setFee] = useState(990);
  const [pop55, setPop55] = useState(12000);

  const applyScenario = (k: ScenKey) => {
    const s = SCENARIOS[k];
    setCpl(s.cpl); setLeadToRdv(s.leadToRdv); setPresence(s.presence); setClosing(s.closing);
    setScenario(k);
  };
  const A = (setter: (n: number) => void) => (n: number) => { setter(n); setScenario(null); };

  const blendedMarge = (partC2 / 100) * margeC2 + (1 - partC2 / 100) * margeC1;
  const ceiling = pop55 * 0.005; // leads/mois absorbables par la zone (estimation)

  const ctx: Ctx = { mode, targetRdv, budget, marge: blendedMarge, fee, ceiling, period };
  const cur: Assum = { cpl, leadToRdv, presence, closing };

  const r = useMemo(() => compute(cur, ctx), [cur, ctx]);
  const rP = useMemo(() => compute(SCENARIOS.prudent, ctx), [ctx]);
  const rO = useMemo(() => compute(SCENARIOS.optimiste, ctx), [ctx]);
  const band = (sel: (x: ReturnType<typeof compute>) => number) => {
    const a = sel(rP), b = sel(rO);
    return [Math.min(a, b), Math.max(a, b)] as const;
  };

  // viabilité (sur le volume de leads/mois)
  const viab = r.leads >= 30
    ? { c: "emerald", t: "Budget viable", d: "Assez de volume pour que Meta apprenne et se stabilise." }
    : r.leads >= 15
    ? { c: "amber", t: "Budget un peu juste", d: "Sortie de phase d'apprentissage lente, résultats instables au début." }
    : { c: "red", t: "Budget trop faible", d: "Pas assez de signal : Meta n'optimise pas, rendement aléatoire." };
  const minBudget = 30 * cpl; // ~30 leads/mois conseillés

  // saturation de zone
  const zone = r.util <= 0.7
    ? { c: "emerald", t: "Zone confortable" }
    : r.util <= 1
    ? { c: "amber", t: "Zone bien exploitée" }
    : { c: "red", t: "Zone saturée — le CPL grimpe" };

  const funnel = [
    { l: "Leads", v: r.leads },
    { l: "RDV", v: r.rdv },
    { l: "Présents", v: r.presents },
    { l: "Appareillages", v: r.ventes },
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Ad Planner</h1>
        <p className="mt-1 text-sm text-mut">Simule le budget Meta Ads, la rentabilité et le bon compromis pour chaque centre.</p>
      </div>

      {/* Mode + période */}
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
              ? <Slider label="RDV de bilan visés / mois" value={targetRdv} set={setTargetRdv} min={5} max={60} />
              : <Slider label="Budget pub mensuel (versé à Meta)" value={budget} set={setBudget} min={300} max={5000} step={50} suffix=" €" />}
          </div>

          <div className={card}>
            <h2 className="mb-4 font-display text-base font-bold">Hypothèses publicité (ajustables)</h2>
            <div className="space-y-4">
              <Slider label="Coût par lead (CPL)" value={cpl} set={A(setCpl)} min={4} max={40} suffix=" €" />
              <Slider label="Taux lead → RDV" value={leadToRdv} set={A(setLeadToRdv)} min={15} max={80} suffix=" %" />
              <Slider label="Taux de présence au RDV" value={presence} set={A(setPresence)} min={50} max={95} suffix=" %" />
              <Slider label="Taux RDV → appareillage" value={closing} set={A(setClosing)} min={10} max={60} suffix=" %" />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-1 font-display text-base font-bold">Économie du centre</h2>
            <p className="mb-4 text-xs text-mut">Marge mixte estimée : <b className="text-ink">{eur(blendedMarge)}</b> / appareillage</p>
            <div className="space-y-4">
              <Slider label="Part de Classe 2 (premium)" value={partC2} set={setPartC2} min={0} max={100} suffix=" %" />
              <Slider label="Marge moyenne Classe 2" value={margeC2} set={setMargeC2} min={600} max={3000} step={50} suffix=" €" />
              <Slider label="Marge moyenne Classe 1 (100% Santé)" value={margeC1} set={setMargeC1} min={0} max={1000} step={25} suffix=" €" />
              <Slider label="Tes honoraires / mois" value={fee} set={setFee} min={300} max={3000} step={10} suffix=" €" />
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold"><MapPin size={16} className="text-accent" /> Zone du centre</h2>
            <p className="mb-4 text-xs text-mut">Plafond estimé : ~<b className="text-ink">{num(ceiling)}</b> leads/mois absorbables avant saturation</p>
            <Slider label="Population 55 ans et + ciblable" value={pop55} set={setPop55} min={1500} max={80000} step={500} />
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

          {/* à présenter */}
          <div className="rounded-2xl border border-line bg-[#081434] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CC2FF]">À présenter au client</p>
            <p className="mt-3 text-[15px] leading-relaxed">
              Budget pub recommandé : <b>{eur(r.budgetPub)}/mois</b> (versé à Meta) + honoraires Neela : <b>{eur(fee)}/mois</b>.
              Résultat visé : <b>~{num(r.rdv)} RDV</b>, <b>~{num1(r.ventes)} appareillages</b>, soit <b>~{eur(r.margeGen)}</b> de marge.
              {" "}Rentable dès <b>{Math.ceil(r.breakEven)}</b> ventes, pour un retour de <b>×{num1(r.roas)}</b>.
            </p>
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
