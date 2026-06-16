import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import RevealText from "@/components/RevealText";
import Marquee from "@/components/Marquee";
import MagneticButton from "@/components/MagneticButton";
import Counter from "@/components/Counter";
import HorizontalAds from "@/components/HorizontalAds";
import Dashboard from "@/components/Dashboard";
import Parallax from "@/components/Parallax";
import Steps from "@/components/Steps";
import GuaranteeBand from "@/components/GuaranteeBand";

const STATS = [
  { to: 4, suffix: "", label: "1 Français sur 4 entend mal" },
  { to: 46, suffix: "%", label: "à peine équipés — le reste à conquérir" },
  { to: 6, suffix: "%/an", label: "de croissance du marché d'ici 2030" },
  { to: 48, suffix: "h", label: "pour lancer vos campagnes" },
];

const SERVICES = [
  {
    n: "01",
    t: "Ciblage local",
    d: "On touche les bonnes personnes autour de votre centre — et leurs proches aidants.",
  },
  {
    n: "02",
    t: "Créations conformes",
    d: "Visuels et messages pensés pour votre métier, conformes à la réglementation santé.",
  },
  {
    n: "03",
    t: "Prise de RDV",
    d: "Formulaire, agenda et relances SMS. Le patient réserve, vous recevez.",
  },
  {
    n: "04",
    t: "Pilotage clair",
    d: "Un compte-rendu chaque semaine : coût par RDV, RDV obtenus. Zéro flou.",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Manifeste */}
      <section className="container-wide py-28 md:py-44">
        <p className="mb-10 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Notre conviction
        </p>
        <h2 className="font-display text-[clamp(1.8rem,4.2vw,3.6rem)] font-bold leading-[1.08] tracking-[-0.025em]">
          <RevealText text="Nous aidons les centres indépendants à rester pleins —" />{" "}
          <span className="text-mut">
            <RevealText
              text="en construisant un système d'acquisition de patients moderne, mesurable et garanti, là où le bouche-à-oreille ne suffit plus."
              delay={0.1}
            />
          </span>
        </h2>
      </section>

      {/* Le constat — stats */}
      <section className="container-wide pb-28 md:pb-40">
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Le constat
          </p>
          <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4.2vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.03em]">
            La demande est là. <span className="text-accent">Captez-la.</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
                <p className="font-display text-[clamp(2.4rem,5vw,3.4rem)] font-bold text-accent">
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-3 text-[14px] font-medium text-mut">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Showcase pubs — défilé horizontal cinématique */}
      <HorizontalAds />

      {/* Aperçu services */}
      <section className="container-wide py-28 md:py-40">
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Ce qu'on livre
          </p>
          <h2 className="max-w-2xl font-display text-[clamp(1.8rem,4.2vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.03em]">
            Un système complet,{" "}
            <span className="text-accent">pas juste de la pub.</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {SERVICES.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <div className="group h-full rounded-3xl border border-line bg-white p-8 transition-colors hover:border-ink">
                <span className="font-display text-sm font-bold text-accent">
                  {s.n}
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold">{s.t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-mut">
                  {s.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Dashboard — résultats mesurables (avec parallax) */}
      <section className="container-wide py-28 md:py-40">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Mesurable
              </p>
              <h2 className="font-display text-[clamp(2rem,4.4vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.03em]">
                Chaque euro <span className="text-accent">tracé.</span>
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-mut">
                Pas de promesses en l'air : un compte-rendu clair chaque semaine.
                RDV obtenus, coût par rendez-vous, évolution. Vous savez
                exactement ce que rapporte chaque campagne.
              </p>
            </Reveal>
          </div>
          <Parallax offset={50}>
            <Dashboard />
          </Parallax>
        </div>
      </section>

      {/* Méthode */}
      <Steps />

      <Marquee
        items={[
          "Ciblage local",
          "Créations conformes",
          "Prise de RDV",
          "Relance SMS",
          "Reporting hebdo",
          "Résultat garanti",
        ]}
      />

      {/* Garantie — bande sombre cinématique */}
      <GuaranteeBand />

      {/* CTA final */}
      <section className="container-wide py-32 text-center md:py-44">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-display text-[clamp(2.2rem,6vw,5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            Prêt à remplir <span className="text-accent">votre agenda</span> ?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-md text-lg text-mut">
            Un échange de 15 minutes, sans engagement, pour voir si Neela est
            fait pour votre centre.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center">
            <MagneticButton href="/contact">
              Réserver mon appel →
            </MagneticButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
