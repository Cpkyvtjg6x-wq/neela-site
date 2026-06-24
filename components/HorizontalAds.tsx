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

// Petit séparateur de chapitre entre deux métiers.
function Chapter({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="flex w-[200px] shrink-0 flex-col justify-center border-l border-line pl-6">
      <span className="font-display text-sm font-bold text-accent">{n}</span>
      <h3 className="mt-2 font-display text-2xl font-bold leading-tight tracking-[-0.02em]">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-snug text-mut">{sub}</p>
    </div>
  );
}

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
    <section ref={section} className="relative h-[420vh] bg-paper">
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

          {/* ——— Audioprothésistes ——— */}
          <Chapter
            n="01"
            title="Audioprothésistes"
            sub="Capter les patients et leurs proches aidants."
          />

          <AdCard
            page="Centre Audition · La Rochelle"
            avatar="A"
            primary="« Tu peux répéter ? » Si vous l'entendez souvent, c'est peut-être le moment d'un bilan."
            label="Les conversations qui comptent"
            domain="centre-audition.fr"
            headline="Réserver un bilan"
            cta="RDV"
            image="/ads/audio-femme-senior.webp"
            alt="Femme senior souriante portant une aide auditive discrète"
          />

          <PhoneStory
            handle="centre.audition"
            title="Réentendre les vôtres."
            subtitle="Un bilan, près de chez vous."
            cta="Je réserve"
            image="/ads/audio-couple-story.webp"
            alt="Couple de seniors souriant dans un parc"
          />

          <AdCard
            page="Votre centre d'audition"
            avatar="A"
            primary="Inutile d'attendre des mois. Faites le point sur votre audition près de chez vous."
            label="Bilan auditif sur rendez-vous"
            domain="votre-centre.fr"
            headline="Prendre rendez-vous"
            cta="Réserver"
            image="/ads/audio-consultation.webp"
            alt="Audioprothésiste présentant une aide auditive à un patient senior"
          />

          {/* ——— Opticiens ——— */}
          <Chapter
            n="02"
            title="Opticiens"
            sub="Faire venir en magasin, capter votre zone."
          />

          <AdCard
            page="Optique du Centre"
            avatar="O"
            primary="Envie de changer de lunettes ? Découvrez la nouvelle collection et réservez votre examen de vue."
            label="La monture qui vous ressemble"
            domain="optique-du-centre.fr"
            headline="Prendre rendez-vous"
            cta="RDV"
            image="/ads/optique-essayage.webp"
            alt="Femme essayant des lunettes élégantes dans un magasin d'optique"
          />

          <PhoneStory
            handle="optique.ducentre"
            title="Nouvelle collection."
            subtitle="Essayez. On s'occupe du reste."
            cta="Je découvre"
            image="/ads/optique-boutique-story.webp"
            alt="Boutique d'optique moderne avec un opticien et une cliente"
          />

          <AdCard
            page="Optique du Centre"
            avatar="O"
            primary="Vos lunettes, votre style. Conseil personnalisé et tiers payant en magasin."
            label="Vos lunettes, votre style"
            domain="optique-du-centre.fr"
            headline="Voir la collection"
            cta="Découvrir"
            image="/ads/optique-portrait.webp"
            alt="Portrait d'une personne portant des lunettes élégantes"
          />
        </motion.div>
      </div>
    </section>
  );
}
