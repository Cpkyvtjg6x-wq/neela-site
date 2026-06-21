"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* Halo d'accent très diffus, en parallax */}
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-[18%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]" />
        <div className="absolute right-[8%] top-[55%] h-[360px] w-[360px] rounded-full bg-accent/10 blur-[110px]" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-wide pt-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-paper/60 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-mut backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Agence d'acquisition · Publicité Meta
        </motion.div>

        <h1 className="font-display font-bold leading-[0.98] tracking-[-0.03em] text-[clamp(2.6rem,8vw,7.2rem)]">
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

      {/* Indicateur de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-mut"
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
