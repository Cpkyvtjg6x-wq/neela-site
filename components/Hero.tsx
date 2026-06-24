"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check, CalendarCheck, TrendingUp } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { EASE } from "@/lib/site";

const TITLE = ["On", "remplit", "l'agenda", "des", "centres", "de", "santé."];

// Variants pour la révélation mot par mot au chargement.
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};
const word = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.85, ease: EASE } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);

  // Parallax doux du halo et du contenu pendant le scroll.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-32 md:pb-0"
    >
      {/* Halo d'accent très diffus + grille subtile, en parallax */}
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-[18%] top-[14%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]" />
        <div className="absolute right-[6%] top-[48%] h-[420px] w-[420px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,10,10,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,10,10,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      </motion.div>

      <div className="container-wide grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Colonne texte */}
        <motion.div style={{ y: contentY, opacity: contentOpacity }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-paper/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-mut backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Agence d'acquisition · Publicité Meta
          </motion.div>

          <h1 className="font-display font-bold leading-[0.98] tracking-[-0.03em] text-[clamp(2.5rem,6.4vw,5.4rem)]">
            <motion.span
              variants={container}
              initial="hidden"
              animate="show"
              className="block"
            >
              {TITLE.map((w, i) => (
                <span
                  key={i}
                  className="mr-[0.22em] inline-block overflow-hidden align-bottom"
                  style={{ paddingBottom: "0.06em" }}
                >
                  <motion.span
                    variants={word}
                    className={`inline-block ${
                      w === "santé." ? "text-accent" : ""
                    }`}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
            className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-mut"
          >
            Des campagnes Facebook &amp; Instagram qui transforment votre zone en
            flux régulier de rendez-vous qualifiés. Création, ciblage, prise de
            RDV — clé en main, et garanti.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <MagneticButton href="/contact">
              Réserver un appel découverte →
            </MagneticButton>
            <MagneticButton href="/realisations" variant="ghost">
              Voir nos réalisations
            </MagneticButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.15 }}
            className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mut"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Sans engagement</span>
            <span className="text-accent">·</span>
            <span>Réponse sous 24&nbsp;h</span>
            <span className="text-accent">·</span>
            <span>Garantie 15&nbsp;RDV le 1<sup>er</sup> mois</span>
          </motion.p>
        </motion.div>

        {/* Colonne visuelle immersive */}
        <motion.div
          style={{ y: visualY }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.5 }}
          className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
        >
          {/* Carte image principale */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-line bg-white shadow-float">
            <Image
              src="/ads/audio-femme-senior.webp"
              alt="Patiente senior souriante, à nouveau pleinement à l'écoute"
              fill
              priority
              sizes="460px"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* Chip flottant : nouveau RDV */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-10 hidden items-center gap-3 rounded-2xl border border-line bg-white/90 p-3 pr-4 shadow-card backdrop-blur lg:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600">
              <CalendarCheck size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-ink">Nouveau rendez-vous</p>
              <p className="text-[11px] text-mut">Bilan auditif · aujourd'hui 14&nbsp;h&nbsp;30</p>
            </div>
          </motion.div>

          {/* Chip flottant : performance */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            className="absolute -right-5 bottom-12 hidden items-center gap-3 rounded-2xl border border-line bg-white/90 p-3 pr-5 shadow-card backdrop-blur lg:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <TrendingUp size={18} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[17px] font-bold text-ink">+23 RDV</p>
              <p className="text-[11px] text-mut">ce mois · 14&nbsp;€ par RDV</p>
            </div>
          </motion.div>

          {/* Chip flottant : garantie */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-3 top-6 hidden items-center gap-2 rounded-full border border-line bg-ink px-3.5 py-2 text-white shadow-card lg:flex"
          >
            <Check size={13} strokeWidth={3} className="text-emerald-400" />
            <span className="text-[12px] font-semibold">Résultat garanti</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Indicateur de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-mut md:flex"
      >
        <span>Défilez</span>
        <span className="relative h-9 w-[1px] overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-3 bg-accent"
            animate={{ y: [-12, 36] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
