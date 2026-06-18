"use client";

import { useMemo, useState } from "react";
import { Target, Wallet, ShieldCheck, Gauge, Rocket } from "lucide-react";

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";
const num = (n: number) => Math.round(n).toLocaleString("fr-FR");

type ScenKey = "prudent" | "realiste" | "optimiste";
const SCENARIOS: Record<ScenKey, { cpl: number; leadToRdv: number; presence: number; closing: number; label: string }> = {
  prudent:   { cpl: 18, leadToRdv: 25, presence: 65, closing: 20, label: "Prudent" },
  realiste:  { cpl: 14, leadToRdv: 35, presence: 70, closing: 25, label: "Réaliste" },
  optimiste: { cpl: 10, leadToRdv: 45, presence: 80, closing: 33, label: "Optimiste" },
};

function Slider({
  label, value, set, min, max, step = 1, suffix = "",
}: {
  label: string; value: number; set: (n: number) => void;
  min: number; max: number; step?: number; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-display text-sm font-bold text-accent">
          {value.toLocaleString("fr-FR")}
          {suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="mt-2 w-full accent-accent"
      />
    </div>
  );
}

export default function AdPlanner() {
  const [mode, setMode] = useState<"objectif" | "budget">("objectif");
  const [targetRdv, setTargetRdv] = useState(20);
  const [budget, setBudget] = useState(1000);

  const [scenario, setScenario] = useState<ScenKey | null>("realiste");
  const [cpl, setCpl] = useState(SCENARIOS.realiste.cpl);
  const [leadToRdv, setLeadToRdv] = useState(SCENARIOS.realiste.leadToRdv);
  const [presence, setPresence] = useState(SCENARIOS.realiste.presence);
  const [closing, setClosing] = useState(SCENARIOS.realiste.closing);
  const [marge, setMarge] = useState(1200);
  const [fee, setFee] = useState(990);

  const applyScenario = (k: ScenKey) => {
    const s = SCENARIOS[k];
    setCpl(s.cpl); setLeadToRdv(s.leadToRdv); setPresence(s.presence); setClosing(s.closing);
    setScenario(k);
  };
  // un réglage manuel d'une hypothèse => scénario "perso"
  const A = (setter: (n: number) => void) => (n: number) => { setter(n); setScenario(null); };

  const r = useMemo(() => {
    const l2r = leadToRdv / 100, pres = presence / 100, cl = closing / 100;
    let budgetPub: number, rdv: number, leads: number;
    if (mode === "objectif") {
      rdv = targetRdv;
      leads = l2r > 0 ? rdv / l2r : 0;
      budgetPub = leads * cpl;
    } else {
      budgetPub = budget;
      leads = cpl > 0 ? budgetPub / cpl : 0;
      rdv = leads * l2r;
    }
    const presents = rdv * pres;
    const ventes = presents * cl;
    const margeGen = ventes * marge;
    const coutParRdv = rdv > 0 ? budgetPub / rdv : 0;
    const totalCost = budgetPub + fee;
    const roas = totalCost > 0 ? margeGen / totalCost : 0;
    const profit = margeGen - totalCost;
    return { budgetPub, leads, rdv, presents, ventes, margeGen, coutParRdv, totalCost, roas, profit };
  }, [mode, targetRdv, budget, cpl, leadToRdv, presence, closing, marge, fee]);

  const funnel = [
    { l: "Leads", v: r.leads },
    { l: "RDV", v: r.rdv },
    { l: "Présents", v: r.presents },
    { l: "Appareillages", v: r.ventes },
  ];
  const fmax = Math.max(1, r.leads);

  const card = "rounded-2xl border border-line bg-white p-5";
  const scenIcons: Record<ScenKey, JSX.Element> = {
    prudent: <ShieldCheck size={15} />,
    realiste: <Gauge size={15} />,
    optimiste: <Rocket size={15} />,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Ad Planner</h1>
        <p className="mt-1 text-sm text-mut">
          Simule le budget Meta Ads à proposer et le retour sur investissement pour ton client.
        </p>
      </div>

      {/* Mode */}
      <div className="mb-5 inline-flex rounded-full border border-line bg-white p-1">
        <button
          onClick={() => setMode("objectif")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "objectif" ? "bg-ink text-paper" : "text-mut"
          }`}
        >
          <Target size={16} /> Partir d'un objectif
        </button>
        <button
          onClick={() => setMode("budget")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "budget" ? "bg-ink text-paper" : "text-mut"
          }`}
        >
          <Wallet size={16} /> Partir d'un budget
        </button>
      </div>

      {/* Scénario */}
      <div className="mb-6 rounded-2xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Scénario d'hypothèses</p>
            <p className="text-xs text-mut">
              {scenario ? `Réglage « ${SCENARIOS[scenario].label} »` : "Réglage personnalisé"} — montre le bas de la fourchette au client, jamais le haut.
            </p>
          </div>
          <div className="inline-flex gap-2">
            {(Object.keys(SCENARIOS) as ScenKey[]).map((k) => (
              <button
                key={k}
                onClick={() => applyScenario(k)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  scenario === k ? "border-accent bg-accent text-white" : "border-line text-mut hover:border-accent"
                }`}
              >
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
            <h2 className="mb-4 font-display text-base font-bold">
              {mode === "objectif" ? "Ton objectif" : "Le budget pub"}
            </h2>
            {mode === "objectif" ? (
              <Slider label="RDV de bilan visés / mois" value={targetRdv} set={setTargetRdv} min={5} max={60} />
            ) : (
              <Slider label="Budget pub mensuel (versé à Meta)" value={budget} set={setBudget} min={300} max={5000} step={50} suffix=" €" />
            )}
          </div>

          <div className={card}>
            <h2 className="mb-4 font-display text-base font-bold">Hypothèses (ajustables)</h2>
            <div className="space-y-4">
              <Slider label="Coût par lead (CPL)" value={cpl} set={A(setCpl)} min={4} max={40} suffix=" €" />
              <Slider label="Taux lead → RDV" value={leadToRdv} set={A(setLeadToRdv)} min={15} max={80} suffix=" %" />
              <Slider label="Taux de présence au RDV" value={presence} set={A(setPresence)} min={50} max={95} suffix=" %" />
              <Slider label="Taux RDV → appareillage" value={closing} set={A(setClosing)} min={10} max={60} suffix=" %" />
              <Slider label="Marge moyenne / appareillage" value={marge} set={setMarge} min={400} max={3000} step={50} suffix=" €" />
              <Slider label="Tes honoraires / mois" value={fee} set={setFee} min={300} max={3000} step={10} suffix=" €" />
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="font-display text-2xl font-bold text-accent">{eur(r.budgetPub)}</p>
              <p className="mt-1 text-[11px] font-medium text-mut">Budget pub / mois</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="font-display text-2xl font-bold">{eur(r.margeGen)}</p>
              <p className="mt-1 text-[11px] font-medium text-mut">Marge générée (client)</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="font-display text-2xl font-bold text-emerald-600">×{r.roas.toFixed(1)}</p>
              <p className="mt-1 text-[11px] font-medium text-mut">Retour / € investi</p>
            </div>
          </div>

          <div className={card}>
            <h2 className="mb-4 font-display text-base font-bold">Entonnoir estimé / mois</h2>
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.l} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-mut">{f.l}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-paper">
                    <div
                      className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-accent to-[#5AA0FF] pr-2 text-[11px] font-bold text-white"
                      style={{ width: `${Math.max(6, (f.v / fmax) * 100)}%` }}
                    >
                      {num(f.v)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="text-mut">Coût par RDV : <b className="text-ink">{eur(r.coutParRdv)}</b></span>
              <span className="text-mut">Appareillages : <b className="text-ink">{num(r.ventes)}</b></span>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-[#081434] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CC2FF]">À présenter au client</p>
            <p className="mt-3 text-[15px] leading-relaxed">
              Budget pub recommandé : <b>{eur(r.budgetPub)}/mois</b> (versé directement à Meta) + honoraires Neela : <b>{eur(fee)}/mois</b>.
              Résultat attendu : <b>~{num(r.rdv)} RDV</b>, <b>~{num(r.ventes)} appareillages</b>, soit <b>~{eur(r.margeGen)} de marge</b>.
              {" "}Pour <b>{eur(r.totalCost)}</b> investis, ça génère <b>{eur(r.margeGen)}</b> — soit un retour de <b>×{r.roas.toFixed(1)}</b>.
            </p>
          </div>

          <p className="text-xs text-mut">
            Chiffres indicatifs (Meta = leads en amont, plus froids que Google). Les 2-3 premiers mois sont une phase d'apprentissage.
            Ne garantis jamais un nombre de RDV : engage-toi sur le budget bien géré et le reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
