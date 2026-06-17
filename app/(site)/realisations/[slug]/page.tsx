import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { projects, getProject } from "@/lib/projects";
import MagneticButton from "@/components/MagneticButton";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProject(params.slug);
  if (!p) return { title: "Concept introuvable" };
  return { title: p.title, description: p.summary };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const p = getProject(params.slug);
  if (!p) notFound();

  return (
    <article className="container-wide pt-40 pb-32">
      <Link href="/realisations" className="text-sm text-mut hover:text-accent">
        ← Tous les concepts
      </Link>

      <div className="mt-10 flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {p.category} · {p.year}
        </p>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
          Concept
        </span>
      </div>
      <h1 className="mt-4 max-w-4xl font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.04] tracking-[-0.03em]">
        {p.title}
      </h1>
      <p className="mt-4 text-lg text-mut">{p.client}</p>

      <div className="mt-12 aspect-[16/8] overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-ink" />

      <div className="mt-14 grid gap-12 md:grid-cols-[1.6fr_1fr]">
        <p className="text-xl leading-relaxed text-ink/85">{p.summary}</p>
        <div className="rounded-3xl border border-line p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mut">
            Objectif type
          </p>
          <p className="mt-3 font-display text-xl font-bold leading-snug text-accent">
            {p.result}
          </p>
        </div>
      </div>

      <div className="mt-20 flex justify-center">
        <MagneticButton href="/contact">
          Obtenir ce type de résultat →
        </MagneticButton>
      </div>
    </article>
  );
}
