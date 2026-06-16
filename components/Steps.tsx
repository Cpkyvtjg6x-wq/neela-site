"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE } from "@/lib/site";

const STEPS = [
  {
    n: "01",
    title: "Audit & stratégie",
    text: "On analyse votre zone, vos concurrents et vos créneaux. On définit l'offre et la cible idéale.",
  },
  {
    n: "02",
    title: "Lancement",
    text: "Création des visuels, ciblage, mise en ligne. Vos premières campagnes tournent en 48 h.",
  },
  {
    n: "03",
    title: "Rendez-vous",
    text: "Les demandes arrivent, sont relancées automatiquement et atterrissent dans votre agenda.",
  },
  {
    n: "04",
    title: "Optimisation",
    text: "Chaque semaine, on affine pour baisser le coût par RDV et augmenter le volume.",
  },
];

export default function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 80%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="container-wide py-28 md:py-40">
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div className="md:sticky md:top-32 md:self-start">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            La méthode
          </p>
          <h2 className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.03em]">
            Quatre étapes.
            <br />
            <span className="text-mut">Une machine qui tourne.</span>
          </h2>
        </div>

        <div ref={ref} className="relative pl-8">
          {/* Ligne de progression */}
          <div className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-line">
            <motion.div
              className="absolute inset-x-0 top-0 origin-top bg-accent"
              style={{ scaleY: lineScale, height: "100%" }}
            />
          </div>

          <div className="flex flex-col gap-10">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20% 0px" }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
                className="relative"
              >
                <span className="absolute -left-8 top-1 flex h-3 w-3 -translate-x-1/2 items-center justify-center">
                  <span className="h-3 w-3 rounded-full border-2 border-accent bg-paper" />
                </span>
                <span className="font-display text-sm font-bold text-accent">
                  {s.n}
                </span>
                <h3 className="mt-1 font-display text-2xl font-bold">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-mut">
                  {s.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
