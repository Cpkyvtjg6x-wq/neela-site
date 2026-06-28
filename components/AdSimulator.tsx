"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ThumbsUp, MessageCircle, CalendarCheck, TrendingUp, Play, Sparkles } from "lucide-react";

/**
 * Mini-simulateur interactif : à gauche on compose la pub (visuel + accroche, qui
 * s'affiche directement sur le rendu) ; à droite, au lancement, la diffusion, les
 * stats et les RDV qui tombent. Compacté pour tenir sur un écran sans scroller.
 * Démo stylisée — aucune écriture n'est incrustée DANS les visuels (texte = UI).
 */

type MetierKey = "audio" | "optique" | "dentaire";
type Visual = { src: string; alt: string };
type Metier = {
  label: string;
  page: string;
  imprBase: number;
  margeParRdv: number;
  visuals: Visual[];
  hooks: string[];
  motifs: string[];
};

const VILLES = ["La Rochelle", "Montpellier", "Bordeaux", "Nantes", "Lyon", "Rennes"];

const METIERS: Record<MetierKey, Metier> = {
  audio: {
    label: "Audioprothésiste",
    page: "Votre centre auditif",
    imprBase: 11800,
    margeParRdv: 500,
    visuals: [
      { src: "/ads/audio-femme-senior.webp", alt: "Femme senior souriante" },
      { src: "/ads/audio-consultation.webp", alt: "Consultation auditive" },
      { src: "/ads/audio-couple-story.webp", alt: "Couple de seniors épanoui" },
    ],
    hooks: [
      "Et si vous réentendiez chaque conversation ?",
      "Bilan auditif offert, tout près de chez vous",
      "Mieux entendre vos petits-enfants, dès ce mois-ci",
    ],
    motifs: ["Bilan auditif", "Essai d'aides auditives", "Contrôle d'audition"],
  },
  optique: {
    label: "Opticien",
    page: "Votre opticien",
    imprBase: 12600,
    margeParRdv: 180,
    visuals: [
      { src: "/ads/optique-portrait.webp", alt: "Portrait avec lunettes" },
      { src: "/ads/optique-essayage.webp", alt: "Essayage de montures" },
      { src: "/ads/optique-boutique-story.webp", alt: "Boutique d'optique" },
    ],
    hooks: [
      "Vos lunettes, essayées et choisies en 30 minutes",
      "Un regard net, une monture qui vous ressemble",
      "Bilan visuel offert ce mois-ci",
    ],
    motifs: ["Examen de vue", "Essai de montures", "Renouvellement"],
  },
  dentaire: {
    label: "Cabinet dentaire",
    page: "Votre cabinet dentaire",
    imprBase: 9400,
    margeParRdv: 350,
    visuals: [
      { src: "/ads/centre-pro.webp", alt: "Professionnelle de santé en cabinet" },
      { src: "/ads/accueil-secretaire.webp", alt: "Accueil d'un patient" },
      { src: "/ads/faq-conseil.webp", alt: "Conseil à une patiente" },
    ],
    hooks: [
      "Un sourire en pleine santé, sans attendre",
      "Nouveau patient ? Bilan offert ce mois-ci",
      "Reprenez rendez-vous chez le dentiste, simplement",
    ],
    motifs: ["Première consultation", "Détartrage", "Bilan dentaire"],
  },
};

// Stats déterministes (mêmes choix → mêmes chiffres) et plausibles marché FR.
function computeStats(m: Metier, visualIdx: number, hookIdx: number) {
  const impr = m.imprBase + hookIdx * 1400 + visualIdx * 500;
  const ctr = 1.4 + hookIdx * 0.4 + visualIdx * 0.15; // %
  const clics = Math.round((impr * ctr) / 100);
  const leads = Math.round(clics * 0.16);
  const rdv = Math.max(8, Math.round(leads * 0.42));
  const cost = Math.round(clics * 1.2);
  const coutRdv = Math.max(8, Math.round(cost / rdv));
  const marge = rdv * m.margeParRdv;
  return { impr, clics, rdv, coutRdv, marge };
}

const fr = (n: number) => n.toLocaleString("fr-FR");

function CountUp({ to, format }: { to: number; format?: (n: number) => string }) {
  const [v, setV] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, reduce]);
  return <>{(format ?? fr)(v)}</>;
}

const BARS = [32, 46, 38, 58, 50, 76, 88];

export default function AdSimulator() {
  const [metier, setMetier] = useState<MetierKey>("audio");
  const [visualIdx, setVisualIdx] = useState(0);
  const [hookIdx, setHookIdx] = useState(0);
  const [stage, setStage] = useState<"compose" | "live">("compose");

  const m = METIERS[metier];
  const hook = m.hooks[hookIdx];
  const stats = useMemo(() => computeStats(m, visualIdx, hookIdx), [m, visualIdx, hookIdx]);

  const pickMetier = (k: MetierKey) => { setMetier(k); setVisualIdx(0); setHookIdx(0); setStage("compose"); };

  return (
    <section className="container-wide py-8 md:py-10">
      <div className="mx-auto mb-5 max-w-2xl text-center">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          <Sparkles size={12} /> Démo interactive
        </p>
        <h2 className="font-display text-[clamp(1.35rem,2.8vw,2.05rem)] font-bold leading-[1.07] tracking-[-0.03em]">
          Composez une pub, <span className="text-accent">voyez l'agenda se remplir.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-mut">
          Un visuel, une accroche, et regardez les rendez-vous tomber — en direct.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl items-stretch gap-5 lg:grid-cols-2">
        {/* ----- Colonne gauche : composer + rendu de la pub ----- */}
        <div className="flex flex-col rounded-[24px] border border-line bg-white p-4 shadow-float md:p-5">
          {/* Métier — centré */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex rounded-full border border-line bg-paper p-1">
              {(Object.keys(METIERS) as MetierKey[]).map((k) => (
                <button key={k} onClick={() => pickMetier(k)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${metier === k ? "bg-accent text-white shadow-sm" : "text-mut hover:text-ink"}`}>
                  {METIERS[k].label}
                </button>
              ))}
            </div>
          </div>

          {/* Visuels */}
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mut">Le visuel</p>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {m.visuals.map((v, i) => (
              <button key={v.src} onClick={() => setVisualIdx(i)} aria-label={`Visuel ${i + 1}`}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition ${visualIdx === i ? "border-accent ring-2 ring-accent/20" : "border-transparent opacity-70 hover:opacity-100"}`}>
                <Image src={v.src} alt={v.alt} fill sizes="140px" className="object-cover" />
              </button>
            ))}
          </div>

          {/* Accroches — modifient directement le rendu */}
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-mut">L'accroche</p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {m.hooks.map((h, i) => (
              <button key={h} onClick={() => setHookIdx(i)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${hookIdx === i ? "border-accent bg-accent text-white" : "border-line text-mut hover:border-accent"}`}>
                Accroche {i + 1}
              </button>
            ))}
          </div>

          {/* Rendu de la pub (remplit l'espace, image extensible) */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-line shadow-card">
            <div className="flex items-center gap-2.5 px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 font-display text-sm font-bold text-accent">N</span>
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-ink">{m.page}</p>
                <p className="text-[10px] text-mut">Sponsorisé · <span className="text-accent">@vous</span></p>
              </div>
              <span className="ml-auto text-mut">···</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={hook} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="px-3 pb-2 text-[13px] font-medium leading-snug text-ink">
                {hook}
              </motion.p>
            </AnimatePresence>
            <div className="relative min-h-[120px] w-full flex-1">
              <Image src={m.visuals[visualIdx].src} alt={m.visuals[visualIdx].alt} fill sizes="(max-width:1024px) 100vw, 480px" className="object-cover" />
            </div>
            <div className="flex items-center justify-between border-t border-line px-3 py-2">
              <div className="flex items-center gap-3 text-mut">
                <span className="flex items-center gap-1 text-[11px]"><ThumbsUp size={12} /> J'aime</span>
                <span className="flex items-center gap-1 text-[11px]"><MessageCircle size={12} /> Commenter</span>
              </div>
              <span className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-bold text-white">Prendre rendez-vous</span>
            </div>
          </div>

          <button onClick={() => setStage("live")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90">
            <Play size={16} /> {stage === "live" ? "Relancer la campagne" : "Lancer la campagne"}
          </button>
        </div>

        {/* ----- Colonne droite : analyse (idle → live) ----- */}
        <div className="flex flex-col rounded-[24px] border border-line bg-white p-4 shadow-float md:p-5">
          <AnimatePresence mode="wait">
            {stage === "compose" ? (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <TrendingUp size={26} />
                </span>
                <p className="mt-4 max-w-[16rem] text-sm text-mut">
                  Cliquez sur <b className="text-ink">Lancer la campagne</b> pour voir la diffusion et les rendez-vous arriver en direct.
                </p>
              </motion.div>
            ) : (
              <LiveBoard key={`live-${metier}-${visualIdx}-${hookIdx}`} m={m} stats={stats} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function LiveBoard({ m, stats }: { m: Metier; stats: ReturnType<typeof computeStats> }) {
  const reduce = useReducedMotion();
  const total = Math.min(stats.rdv, 4);
  const [shown, setShown] = useState(reduce ? total : 0);
  const [done, setDone] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= total) { clearInterval(id); setTimeout(() => setDone(true), 600); }
    }, 700);
    return () => clearInterval(id);
  }, [total, reduce]);

  const feed = Array.from({ length: total }, (_, i) => ({
    motif: m.motifs[i % m.motifs.length],
    ville: VILLES[i % VILLES.length],
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1877F2] text-[12px] font-bold text-white">f</span>
        <span className="text-[13px] font-bold text-ink/80">Campagne en direct</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> diffusion active
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: <CountUp to={stats.impr} />, l: "touchées" },
          { v: <CountUp to={stats.clics} />, l: "clics" },
          { v: <><CountUp to={stats.coutRdv} /> €</>, l: "coût / RDV" },
        ].map((k, i) => (
          <div key={i} className="rounded-xl border border-line bg-paper p-2.5">
            <div className="font-display text-base font-bold text-ink">{k.v}</div>
            <div className="text-[10px] text-mut">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Graphe RDV/jour */}
      <div className="mt-2.5 rounded-xl border border-line bg-paper p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-ink/70">Rendez-vous / jour</span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><TrendingUp size={12} /> en hausse</span>
        </div>
        <div className="flex h-14 items-end gap-1.5">
          {BARS.map((h, i) => (
            <motion.div key={i} className={`flex-1 rounded ${i >= 5 ? "bg-accent" : "bg-accent/25"}`}
              initial={{ height: reduce ? `${h}%` : 0 }} animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: "easeOut" }} />
          ))}
        </div>
      </div>

      {/* Flux RDV entrants */}
      <div className="mt-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mut">Rendez-vous entrants</p>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{shown >= total ? stats.rdv : shown} ce mois</span>
        </div>
        <div className="space-y-1.5">
          <AnimatePresence>
            {feed.slice(0, shown).map((r, i) => (
              <motion.div key={i} layout
                initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.32 }}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-white p-2 shadow-card">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600">
                  <CalendarCheck size={14} />
                </span>
                <div className="leading-tight">
                  <p className="text-[12px] font-bold text-ink">Nouveau rendez-vous</p>
                  <p className="text-[10px] text-mut">{r.motif} · {r.ville}</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">+1</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Bilan + CTA — carte claire (vert succès), plus de bleu marine */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} className="mt-auto pt-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[12.5px] leading-relaxed text-ink">
                <b>~{fr(stats.rdv)} rendez-vous</b> ce mois-ci, soit <b className="text-emerald-700">~{fr(stats.marge)} €</b> de marge potentielle.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Link href="/contact" className="rounded-lg bg-accent px-3.5 py-1.5 text-[13px] font-bold text-white hover:opacity-90">
                  Obtenir ces résultats →
                </Link>
                <span className="text-[10px] text-mut">Démo · chiffres indicatifs</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
