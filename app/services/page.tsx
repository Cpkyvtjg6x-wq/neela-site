import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import MagneticButton from "@/components/MagneticButton";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Acquisition de patients pour centres de santé indépendants : création publicitaire, ciblage local, tunnel de prise de rendez-vous et pilotage des résultats.",
};

const SERVICES = [
  {
    n: "01",
    title: "Création publicitaire",
    text: "Visuels et messages pensés pour votre métier, conformes à la réglementation santé. On parle à vos futurs patients — et à leurs proches.",
  },
  {
    n: "02",
    title: "Ciblage local",
    text: "On touche les bonnes personnes autour de votre centre, au bon moment, sur Facebook et Instagram.",
  },
  {
    n: "03",
    title: "Tunnel de rendez-vous",
    text: "Formulaire, agenda et relances SMS automatiques. Le patient réserve, vous n'avez qu'à recevoir.",
  },
  {
    n: "04",
    title: "Pilotage & reporting",
    text: "Un compte-rendu clair chaque semaine : coût par rendez-vous, RDV obtenus, évolution. Zéro flou.",
  },
];

export default function ServicesPage() {
  return (
    <div className="container-wide pt-40 pb-32">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Services
      </p>
      <h1 className="max-w-3xl font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
        Un système complet, pas juste de la pub.
      </h1>

      <div className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
        {SERVICES.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.05}>
            <div className="h-full bg-paper p-10">
              <span className="font-display text-sm font-bold text-accent">
                {s.n}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold">{s.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-mut">
                {s.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-20 flex justify-center">
        <MagneticButton href="/contact">Réserver un appel →</MagneticButton>
      </div>
    </div>
  );
}
