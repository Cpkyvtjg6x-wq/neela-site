"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import AdCard from "./AdCard";
import PhoneStory from "./PhoneStory";

/**
 * Section cinématique : on « épingle » le contenu (sticky) et les maquettes
 * défilent horizontalement au fil du scroll vertical (effet façon Apple).
 * La distance est mesurée pour s'arrêter pile sur la dernière carte.
 */
export default function HorizontalAds() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (track.current) {
        setDist(Math.max(0, track.current.scrollWidth - window.innerWidth));
      }
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist]);

  return (
    <section ref={section} className="relative h-[300vh] bg-paper">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div
          ref={track}
          style={{ x }}
          className="flex items-center gap-7 pl-[6vw] pr-[6vw] will-change-transform"
        >
          {/* Panneau d'intro */}
          <div className="w-[78vw] shrink-0 sm:w-[420px]">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              En images
            </p>
            <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              Pas des « likes ».
              <br />
              <span className="text-accent">Des rendez-vous.</span>
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-mut">
              Des créations conçues pour votre métier, conformes à la
              réglementation santé. Faites défiler →
            </p>
          </div>

          <AdCard
            page="Centre Audition · La Rochelle"
            primary="« Tu peux répéter ? » Si vous l'entendez souvent, c'est peut-être le moment d'un bilan."
            label="Les conversations qui comptent"
            headline="Réserver un bilan"
            cta="RDV"
          />

          <PhoneStory
            title="Un bilan offert"
            subtitle="À deux pas de chez vous."
            cta="Je réserve"
          />

          <AdCard
            page="Votre centre"
            primary="Inutile d'attendre des mois. Faites le point sur votre audition près de chez vous."
            label="Bilan auditif sur rendez-vous"
            headline="Prendre rendez-vous"
            cta="Réserver"
          />

          <PhoneStory
            handle="centre.audition"
            title="Vous entendez mal ?"
            subtitle="Un test rapide, près de chez vous."
            cta="Je réserve mon créneau"
          />

          <AdCard
            page="Expert local"
            primary="Votre centre indépendant vous accueille pour votre audition. Suivi de proximité."
            label="Un expert, près de chez vous"
            headline="Prendre RDV"
            cta="RDV"
          />
        </motion.div>
      </div>
    </section>
  );
}
