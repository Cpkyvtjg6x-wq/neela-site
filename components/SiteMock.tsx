import Image from "next/image";

/**
 * Maquette « vivante » d'un site de centre de santé : fenêtre navigateur
 * stylisée dont la page défile en continu (CSS transform-only, neutralisé
 * automatiquement en prefers-reduced-motion par globals.css).
 * Visuel attitré de l'offre « Création de sites ».
 */
function SitePage() {
  return (
    <div className="space-y-3 p-3">
      {/* Hero du site */}
      <div className="relative h-40 overflow-hidden rounded-xl">
        <Image
          src="/ads/optique-essayage.webp"
          alt=""
          fill
          sizes="360px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <div className="h-2.5 w-3/4 rounded bg-white/90" />
          <div className="mt-1.5 h-2 w-1/2 rounded bg-white/60" />
          <div className="mt-2.5 inline-block rounded-full bg-accent px-3 py-1 text-[9px] font-bold text-white">
            Prendre rendez-vous
          </div>
        </div>
      </div>
      {/* Bloc prise de RDV */}
      <div className="rounded-xl border border-line p-3">
        <div className="h-2 w-1/3 rounded bg-ink/70" />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-6 rounded-md border border-line bg-paper" />
          <div className="h-6 rounded-md border border-line bg-paper" />
          <div className="h-6 rounded-md bg-accent/90" />
        </div>
      </div>
      {/* Avis */}
      <div className="rounded-xl border border-line p-3">
        <div className="text-[11px] leading-none text-amber-500">★★★★★</div>
        <div className="mt-2 h-1.5 w-full rounded bg-ink/10" />
        <div className="mt-1 h-1.5 w-4/5 rounded bg-ink/10" />
      </div>
    </div>
  );
}

export default function SiteMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {/* Barre du navigateur */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 flex-1 truncate rounded-md bg-paper px-2.5 py-1 text-[10px] text-mut">
          centre-audition.fr
        </span>
      </div>
      {/* Fenêtre : la page défile */}
      <div className="relative h-[300px] overflow-hidden">
        <div className="anim-pagescroll absolute inset-x-0 top-0">
          <SitePage />
          <SitePage />
        </div>
        {/* Voile bas pour fondre la boucle */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
