import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { projects, getProject } from "@/lib/projects";
import MagneticButton from "@/components/MagneticButton";

// Génère les pages statiques pour chaque projet (SEO + perf).
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProject(params.slug);
  if (!p) return { title: "Réalisation introuvable" };
  return { title: p.title, description: p.summary };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) notFound();

  return (
    <article className="container-wide pt-40 pb-32">
      <Link href="/realisations" className="text-sm text-mut hover:text-accent">
        ← Toutes les réalisations
      </Link>

      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {p.category} · {p.year}
      </p>
      <h1 className="mt-4 max-w-4xl font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.04] tracking-[-0.03em]">
        {p.title}
      </h1>
      <p className="mt-4 text-lg text-mut">{p.client}</p>

      <div className="mt-12 aspect-[16/8] overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-ink" />

      <div className="mt-14 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <p className="text-xl leading-relaxed text-ink/85">{p.summary}</p>
        <div className="rounded-3xl border border-line p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mut">
            Résultat
          </p>
          <p className="mt-3 font-display text-xl font-bold leading-snug text-accent">
            {p.result}
          </p>
        </div>
      </div>

      <div className="mt-20 flex justify-center">
        <MagneticButton href="/contact">
          Obtenir les mêmes résultats →
        </MagneticButton>
      </div>
    </article>
  );
}
