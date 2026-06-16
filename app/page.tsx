import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import RevealText from "@/components/RevealText";
import Marquee from "@/components/Marquee";
import MagneticButton from "@/components/MagneticButton";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Manifeste */}
      <section className="container-wide py-32 md:py-44">
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
