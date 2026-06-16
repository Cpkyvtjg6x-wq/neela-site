"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/lib/site";

/** Bande sombre spectaculaire (transition cinématique) — la garantie. */
export default function GuaranteeBand() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [-120, 120]);

  return (
    <section className="px-5 py-10 md:px-8">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative overflow-hidden rounded-[40px] bg-ink px-6 py-28 text-center md:py-36"
      >
        <motion.div
          aria-hidden
          style={{ y: glowY }}
          className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/30 blur-[120px]"
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#9CC2FF]">
            Zéro risque
          </p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
            Pas au moins <span className="text-[#5AA0FF]">15 rendez-vous</span>{" "}
            qualifiés le premier mois ? On continue gratuitement.
          </h2>
          <p className="mt-6 text-lg font-medium text-[#9CC2FF]">
            Vous ne pariez pas — c'est nous qui prenons le risque.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
