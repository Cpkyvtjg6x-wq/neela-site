import Link from "next/link";
import { Globe2, LayoutDashboard, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import SiteMock from "./SiteMock";
import CrmMock from "./CrmMock";

/**
 * « Le Pont » — charnière du récit et du positionnement : les DEUX offres
 * (Création de sites + CRM complet) présentées comme un seul système, chacune
 * avec son visuel attitré vivant. C'est ici que le Fil se scinde en deux brins.
 */
export default function LePont() {
  return (
    <section className="container-wide py-28 md:py-40">
      <Reveal>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Deux outils, un système
        </p>
        <h2 className="max-w-3xl font-display text-[clamp(1.9rem,4.6vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.03em]">
          Le site attire. Le CRM transforme.{" "}
          <span className="text-mut">
            Neela construit les deux — et les relie.
          </span>
        </h2>
      </Reveal>

      <div className="relative mt-16 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Offre 1 — Site */}
        <Reveal>
          <div className="group rounded-[28px] border border-line bg-paper p-6 transition-colors hover:border-ink md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Globe2 size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-accent">01 · Votre vitrine</p>
                <h3 className="font-display text-xl font-bold">Création de sites</h3>
              </div>
            </div>
            <SiteMock />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-mut">
              Être trouvé, et donner envie. Un site rapide, élégant et conforme,
              pensé pour transformer le visiteur en rendez-vous.
            </p>
            <Link
              href="/services"
              data-cursor
              className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink transition-colors hover:text-accent"
            >
              Créer mon site
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        {/* Offre 2 — CRM */}
        <Reveal delay={0.08}>
          <div className="group rounded-[28px] border border-line bg-paper p-6 transition-colors hover:border-ink md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <LayoutDashboard size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-accent">02 · Votre moteur</p>
                <h3 className="font-display text-xl font-bold">CRM complet</h3>
              </div>
            </div>
            <CrmMock />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-mut">
              Ne perdre personne. Pipeline, agenda, relances SMS, factures et
              reporting — tout votre cabinet piloté au même endroit.
            </p>
            <Link
              href="/services"
              data-cursor
              className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink transition-colors hover:text-accent"
            >
              Voir le CRM
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
