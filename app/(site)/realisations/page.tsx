import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Exemples de campagnes d'acquisition de patients menées pour des centres de santé indépendants.",
};

export default function RealisationsPage() {
  return (
    <div className="container-wide pt-40 pb-32">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Réalisations
      </p>
      <h1 className="max-w-3xl font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
        Des campagnes pensées pour la santé.
      </h1>

      <div className="mt-20 grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.06}>
            <Link
              href={`/realisations/${p.slug}`}
              data-cursor
              className="group block overflow-hidden rounded-3xl border border-line bg-paper p-8 transition-colors hover:border-ink"
            >
              <div className="mb-6 flex aspect-[16/10] items-end overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-ink p-6">
                <span className="font-display text-2xl font-bold text-paper">
                  {p.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-bold">{p.client}</p>
                  <p className="text-sm text-mut">{p.category}</p>
                </div>
                <span className="text-sm text-mut">{p.year}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      <p className="mt-12 text-sm text-mut">
        * Exemples illustratifs — à remplacer par tes vrais cas clients.
      </p>
    </div>
  );
}
