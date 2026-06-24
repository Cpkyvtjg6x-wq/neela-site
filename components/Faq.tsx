"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Reveal from "./Reveal";
import { EASE } from "@/lib/site";

const FAQ = [
  {
    q: "Combien ça coûte ?",
    a: "Un budget publicitaire (versé directement à Meta) plus des honoraires de gestion adaptés à votre zone et à vos objectifs. Tout est transparent et discuté lors de l'appel découverte — aucune surprise.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "On démarre sur un premier mois. La garantie est là pour ça : si vous n'avez pas au moins 15 rendez-vous qualifiés, on continue gratuitement jusqu'à les atteindre.",
  },
  {
    q: "En combien de temps les premiers rendez-vous ?",
    a: "Vos campagnes sont en ligne sous 48 h après le lancement. Les premières demandes arrivent en général dès la première semaine.",
  },
  {
    q: "Est-ce conforme à la réglementation santé ?",
    a: "Oui. Nos visuels et nos messages sont pensés pour le secteur de la santé et respectent les règles de communication propres à votre métier.",
  },
  {
    q: "Et si je fais déjà de la publicité ?",
    a: "On audite l'existant, on garde ce qui fonctionne et on corrige le reste. Le gain vient souvent d'un meilleur ciblage et d'un vrai tunnel de prise de rendez-vous.",
  },
  {
    q: "Que se passe-t-il si je n'ai pas de résultats ?",
    a: "Vous ne prenez aucun risque : pas au moins 15 rendez-vous qualifiés le premier mois, on travaille gratuitement jusqu'à ce que ce soit le cas. C'est nous qui portons le risque.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="container-wide py-28 md:py-40">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr]">
        <div className="md:sticky md:top-32 md:self-start">
          <Reveal>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Questions fréquentes
            </p>
            <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.03em]">
              Tout est clair,
              <br />
              <span className="text-mut">avant même l'appel.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl border border-line md:block">
              <Image
                src="/ads/faq-conseil.webp"
                alt="Conseil rassurant entre un conseiller et un patient"
                fill
                sizes="(max-width: 1024px) 0px, 420px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
            </div>
          </Reveal>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-lg font-bold md:text-xl">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isOpen ? "border-accent text-accent" : "border-line text-mut"
                    }`}
                  >
                    <Plus size={17} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-6 text-[15px] leading-relaxed text-mut">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
