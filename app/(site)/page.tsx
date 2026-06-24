import Image from "next/image";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import MagneticButton from "@/components/MagneticButton";
import LePont from "@/components/LePont";
import FeatureRow from "@/components/FeatureRow";
import MetaAdsLive from "@/components/MetaAdsLive";
import HorizontalAds from "@/components/HorizontalAds";
import Testimonials from "@/components/Testimonials";
import GuaranteeBand from "@/components/GuaranteeBand";
import Faq from "@/components/Faq";

// Petit cadre photo premium réutilisable comme média de FeatureRow.
function Framed({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-[28px] border border-line shadow-float">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 600px"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Les deux offres (Site + CRM) comme un système */}
      <LePont />

      {/* 01 — Être trouvé : le site / la visibilité (image) */}
      <FeatureRow
        eyebrow="01 · Être trouvé"
        title="Le centre qu'on trouve,"
        accent="et qu'on choisit."
        text="Un site rapide et élégant, pensé pour votre métier. Vos futurs patients vous trouvent, comprennent, et réservent — en quelques secondes."
        bullets={[
          "Design premium, conforme à la réglementation santé",
          "Entièrement pensé pour la prise de rendez-vous",
          "Rapide, et bien référencé localement",
        ]}
        cta={{ href: "/realisations", label: "Voir des exemples de sites" }}
        media={<Framed src="/ads/centre-pro.webp" alt="Professionnelle de santé accueillante dans son centre moderne" />}
      />

      {/* 02 — Faire venir : campagnes Meta (écran data animé) */}
      <FeatureRow
        reverse
        eyebrow="02 · Faire venir"
        title="Des campagnes qui"
        accent="remplissent l'agenda."
        text="On diffuse les bonnes créations aux bonnes personnes autour de votre centre, et on suit chaque euro. Les rendez-vous tombent — vous les voyez arriver en direct."
        bullets={[
          "Ciblage local précis (zone + proches aidants)",
          "Créations conçues pour votre métier",
          "Chaque rendez-vous tracé et mesuré",
        ]}
        media={<MetaAdsLive />}
      />

      {/* Showcase créatives — défilé horizontal cinématique */}
      <HorizontalAds />

      {/* 03 — Accueillir & piloter : le CRM / la réception (image) */}
      <FeatureRow
        eyebrow="03 · Accueillir & piloter"
        title="Le patient réserve,"
        accent="vous accueillez."
        text="Formulaire, agenda, relances SMS, factures, reporting : tout votre cabinet piloté au même endroit. Vous vous concentrez sur vos patients — le reste tourne tout seul."
        bullets={[
          "Prise de rendez-vous et relances automatiques",
          "Pipeline et agenda synchronisés",
          "Un compte-rendu clair chaque semaine",
        ]}
        cta={{ href: "/realisations", label: "Découvrir le CRM" }}
        media={<Framed src="/ads/accueil-secretaire.webp" alt="Accueil chaleureux d'un patient dans un centre de santé" />}
      />

      {/* Preuve sociale — témoignages */}
      <Testimonials />

      {/* Garantie — bande sombre cinématique */}
      <GuaranteeBand />

      {/* FAQ illustrée */}
      <Faq />

      {/* CTA final — image + texte */}
      <section className="container-wide py-28 md:py-40">
        <div className="overflow-hidden rounded-[36px] border border-line bg-paper">
          <div className="grid items-center gap-0 md:grid-cols-2">
            <div className="p-10 md:p-14">
              <Reveal>
                <h2 className="font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-[-0.03em]">
                  Prêt à remplir <span className="text-accent">votre agenda</span> ?
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-md text-lg text-mut">
                  Un échange de 15 minutes, sans engagement, pour voir si Neela
                  est fait pour votre centre.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-9">
                  <MagneticButton href="/contact">Réserver mon appel →</MagneticButton>
                </div>
                <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mut">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Sans engagement</span>
                  <span className="text-accent">·</span>
                  <span>Réponse sous 24&nbsp;h</span>
                  <span className="text-accent">·</span>
                  <span>Garantie 15&nbsp;RDV le 1<sup>er</sup> mois</span>
                </p>
              </Reveal>
            </div>
            <div className="relative h-64 md:h-full md:min-h-[420px]">
              <Image
                src="/ads/audio-couple-story.webp"
                alt="Un couple de seniors épanoui"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:bg-gradient-to-r md:from-paper/40 md:to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
