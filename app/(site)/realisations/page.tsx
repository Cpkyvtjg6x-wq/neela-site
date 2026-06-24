import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { projects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Concepts de campagnes",
  description:
    "Des exemples concrets de notre approche pour remplir l'agenda des centres de santé indépendants. Nos premiers cas clients chiffrés arrivent bientôt.",
};

export default function RealisationsPage() {
  return (
    <div className="container-wide pt-40 pb-32">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Concepts de campagnes
      </p>
      <h1 className="max-w-3xl font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
        Notre approche, en images.
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-mut">
        Voici des exemples de campagnes que nous concevons pour des centres
        d'audioprothèse et d'optique. Nos premières études de cas clients,
        chiffrées, arrivent très bientôt.
      </p>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
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
    </div>
  );
}
