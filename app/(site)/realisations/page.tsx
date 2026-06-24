import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import MiniSite from "@/components/MiniSite";
import CrmShowcase from "@/components/CrmShowcase";
import MagneticButton from "@/components/MagneticButton";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Nos prestations, en images",
  description:
    "Sites vitrine, CRM complet et créatives Meta : un aperçu concret de tout ce que Neela construit pour les centres de santé indépendants.",
};

const SITES = [
  {
    profession: "Audioprothésiste",
    url: "centre-audition.fr",
    tagline: "Bilan auditif sur rendez-vous",
    image: "/ads/audio-consultation.webp",
    accent: "#2563EB",
  },
  {
    profession: "Opticien",
    url: "optique-du-centre.fr",
    tagline: "Nouvelle collection & examen de vue",
    image: "/ads/optique-essayage.webp",
    accent: "#0EA5A4",
  },
  {
    profession: "Cabinet dentaire",
    url: "cabinet-dentaire.fr",
    tagline: "De nouveaux patients, en ligne",
    accent: "#06B6D4",
  },
  {
    profession: "Kiné · paramédical",
    url: "cabinet-kine.fr",
    tagline: "Prise de rendez-vous simplifiée",
    accent: "#6366F1",
  },
];

export default function RealisationsPage() {
  return (
    <div className="pt-40 pb-32">
      {/* En-tête */}
      <div className="container-wide">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Nos prestations, en images
        </p>
        <h1 className="max-w-3xl font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          Tout ce qu'on construit pour vous.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-mut">
          Un site qui convertit, un CRM qui pilote, des créatives qui remplissent
          l'agenda. Voici à quoi ça ressemble — en vrai.
        </p>
      </div>

      {/* 01 — Sites vitrine */}
      <section className="container-wide mt-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-accent">01 · Sites vitrine</p>
              <h2 className="mt-2 font-display text-[clamp(1.6rem,3.6vw,2.8rem)] font-bold tracking-[-0.02em]">
                Des sites pensés par métier.
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm text-mut md:block">
              Rapides, élégants, conformes santé — et conçus pour transformer le
              visiteur en rendez-vous.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SITES.map((s, i) => (
            <Reveal key={s.url} delay={i * 0.05}>
              <MiniSite {...s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 02 — CRM complet */}
      <section className="container-wide mt-28 md:mt-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <Reveal>
            <div>
              <p className="text-sm font-bold text-accent">02 · CRM complet</p>
              <h2 className="mt-2 font-display text-[clamp(1.6rem,3.6vw,2.8rem)] font-bold leading-[1.06] tracking-[-0.02em]">
                Le moteur qui ne perd personne.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mut">
                Pipeline, agenda, relances SMS, factures, reporting : tout votre
                cabinet au même endroit. Un vrai logiciel, pas une feuille de
                calcul. Faites défiler dans la fenêtre pour le parcourir →
              </p>
              <ul className="mt-6 space-y-2.5 text-[15px] text-ink/80">
                {[
                  "Cockpit quotidien : qui appeler, quoi relancer",
                  "Pipeline visuel du contact au patient",
                  "Agenda & relances SMS automatiques",
                  "Facturation et reporting intégrés",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CrmShowcase />
          </Reveal>
        </div>
      </section>

      {/* 03 — Créatives & campagnes */}
      <section className="container-wide mt-28 md:mt-40">
        <Reveal>
          <p className="text-sm font-bold text-accent">03 · Créatives & campagnes</p>
          <h2 className="mt-2 max-w-2xl font-display text-[clamp(1.6rem,3.6vw,2.8rem)] font-bold leading-[1.06] tracking-[-0.02em]">
            Des concepts conçus pour faire prendre rendez-vous.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <Link
                href={`/realisations/${p.slug}`}
                data-cursor
                className="group block overflow-hidden rounded-3xl border border-line bg-paper p-8 transition-colors hover:border-ink"
              >
                <div className="relative mb-6 flex aspect-[16/10] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-ink p-6">
                  {p.image && (
                    <>
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    </>
                  )}
                  <span className="relative font-display text-2xl font-bold text-paper drop-shadow">
                    {p.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold">{p.client}</p>
                    <p className="text-sm text-mut">{p.category}</p>
                  </div>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                    Concept
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="container-wide mt-28 flex flex-col items-center text-center md:mt-40">
        <Reveal>
          <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4.4vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.03em]">
            On construit le vôtre ?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8">
            <MagneticButton href="/contact">Réserver un appel →</MagneticButton>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
