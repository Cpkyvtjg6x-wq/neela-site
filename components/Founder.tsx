"use client";

import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { EASE } from "@/lib/site";

// ⚠️ À PERSONNALISER : ton prénom, ton histoire, et ta photo.
// Pour la photo : dépose un fichier dans /public (ex. /public/founder.jpg)
// puis remplace le bloc « placeholder » ci-dessous par :
//   <img src="/founder.jpg" alt="..." className="h-full w-full object-cover" />
const FOUNDER = {
  firstName: "Jean",
  fullName: "Jean Amin",
  role: "Fondateur de Neela",
};

export default function Founder() {
  return (
    <section className="container-wide py-28 md:py-40">
      <div className="grid items-center gap-14 md:grid-cols-[0.85fr_1.15fr]">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-3 -z-10 rounded-[36px] bg-accent/10 blur-2xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-accent/15 to-paper shadow-float">
            {/* Placeholder — remplace par ta photo (voir commentaire en haut du fichier) */}
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <span className="font-display text-6xl font-bold text-accent/40">
                {FOUNDER.firstName.slice(0, 1)}
              </span>
              <span className="mt-2 text-xs uppercase tracking-[0.18em] text-mut">
                Ta photo ici
              </span>
            </div>
          </div>
        </motion.div>

        {/* Texte */}
        <div>
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Derrière Neela
            </p>
            <h2 className="font-display text-[clamp(1.9rem,4.2vw,3.2rem)] font-bold leading-[1.06] tracking-[-0.03em]">
              Un interlocuteur,{" "}
              <span className="text-accent">pas un call-center.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-6 max-w-xl space-y-4 text-[16px] leading-relaxed text-mut">
              <p>
                J'ai créé Neela avec une conviction simple : les centres de santé
                indépendants méritent une acquisition de patients aussi sérieuse
                que celle des grands réseaux — sans le jargon ni les promesses en l'air.
              </p>
              <p>
                Vous parlez directement à la personne qui gère vos campagnes. Pas
                de sous-traitance, pas de boîte noire : des résultats mesurés,
                expliqués, et une garantie qui m'engage autant que vous.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-7 font-display text-lg font-bold">
              {FOUNDER.fullName}
              <span className="ml-2 font-sans text-sm font-medium text-mut">
                — {FOUNDER.role}
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
