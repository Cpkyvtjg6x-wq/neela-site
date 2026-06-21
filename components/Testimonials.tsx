"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import Reveal from "./Reveal";
import Counter from "./Counter";
import { EASE } from "@/lib/site";

// ⚠️ À PERSONNALISER : remplace par tes vrais résultats clients.
const RESULTS = [
  { prefix: "+", to: 27, suffix: " RDV", label: "par mois en moyenne / centre" },
  { prefix: "−", to: 38, suffix: " %", label: "de coût par rendez-vous" },
  { prefix: "", to: 48, suffix: " h", label: "pour lancer vos campagnes" },
];

// ⚠️ À PERSONNALISER : remplace par de vrais témoignages (avec accord du client).
const TESTIMONIALS = [
  {
    quote:
      "En deux mois, mon agenda est passé de creux à complet. Je ne pensais pas que la publicité pouvait être aussi carrée et mesurable.",
    name: "Sophie M.",
    role: "Gérante",
    place: "Centre Audition · La Rochelle",
  },
  {
    quote:
      "Le coût par rendez-vous a fondu et je reçois enfin des patients vraiment intéressés, pas des curieux.",
    name: "Karim B.",
    role: "Audioprothésiste",
    place: "Bordeaux",
  },
  {
    quote:
      "Un compte-rendu clair chaque semaine, zéro prise de tête. Je me concentre sur mes patients, Neela s'occupe du reste.",
    name: "Élodie R.",
    role: "Opticienne",
    place: "La Flotte",
  },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function Testimonials() {
  return (
    <section className="container-wide py-28 md:py-40">
      <Reveal>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Ils nous font confiance
        </p>
        <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4.2vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.03em]">
          Des agendas qui <span className="text-accent">se remplissent.</span>
        </h2>
      </Reveal>

      {/* Bandeau résultats */}
      <div className="mt-14 grid gap-5 sm:grid-cols-3">
        {RESULTS.map((r, i) => (
          <Reveal key={r.label} delay={i * 0.06}>
            <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
              <p className="font-display text-[clamp(2.2rem,4.6vw,3.2rem)] font-bold text-accent">
                {r.prefix}
                <Counter to={r.to} suffix={r.suffix} />
              </p>
              <p className="mt-2 text-[14px] font-medium text-mut">{r.label}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Témoignages */}
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
            className="flex h-full flex-col rounded-3xl border border-line bg-white p-8 transition-colors hover:border-ink"
          >
            <Quote size={26} className="text-accent/30" />
            <div className="mt-2 flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-[15.5px] leading-relaxed text-ink/85">
              « {t.quote} »
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-bold text-accent">
                {initials(t.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{t.name}</span>
                <span className="block truncate text-[13px] text-mut">
                  {t.role} · {t.place}
                </span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
