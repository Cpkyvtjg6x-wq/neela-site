"use client";

import { motion } from "framer-motion";
import { Ear, Glasses, Stethoscope, HeartPulse, Check } from "lucide-react";
import Reveal from "./Reveal";
import { EASE } from "@/lib/site";

const AUDIENCES = [
  { icon: Ear, t: "Audioprothésistes", d: "Centres d'audition indépendants et petits réseaux." },
  { icon: Glasses, t: "Opticiens", d: "Magasins de quartier qui veulent capter leur zone." },
  { icon: Stethoscope, t: "Cabinets dentaires", d: "Praticiens cherchant de nouveaux patients." },
  { icon: HeartPulse, t: "Centres médicaux", d: "Kinés, ostéos et paramédicaux en développement." },
];

const INCLUS = [
  "Ciblage local précis (zone + proches aidants)",
  "Créations conformes à la réglementation santé",
  "Tunnel & prise de rendez-vous en ligne",
  "Relances SMS automatiques",
  "Reporting clair chaque semaine",
  "Garantie : 15 RDV le premier mois",
];

export default function ForWho() {
  return (
    <section className="container-wide py-28 md:py-40">
      <div className="grid items-start gap-14 lg:grid-cols-[1fr_1fr]">
        {/* Pour qui */}
        <div>
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Pour qui
            </p>
            <h2 className="font-display text-[clamp(1.8rem,4.2vw,3.2rem)] font-bold leading-[1.06] tracking-[-0.03em]">
              Pensé pour les métiers{" "}
              <span className="text-accent">de la santé.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mut">
              On ne fait pas « de la pub pour tout le monde ». On connaît votre
              métier, vos patients et vos contraintes.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.t}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-12% 0px" }}
                  transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                  className="group rounded-3xl border border-line bg-white p-6 transition-colors hover:border-ink"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{a.t}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-mut">{a.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Ce qui est inclus */}
        <Reveal delay={0.1}>
          <div className="rounded-[32px] border border-line bg-ink p-9 text-white shadow-float md:sticky md:top-28">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#9CC2FF]">
              Ce qui est inclus
            </p>
            <h3 className="font-display text-2xl font-bold leading-tight md:text-3xl">
              Un système complet, clé en main.
            </h3>
            <ul className="mt-7 space-y-3.5">
              {INCLUS.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Check size={13} strokeWidth={3} className="text-white" />
                  </span>
                  <span className="text-[15px] leading-snug text-white/90">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
