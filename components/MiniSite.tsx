import Image from "next/image";

/**
 * Miniature de site vitrine d'exemple (par métier). Petite fenêtre navigateur
 * avec hero (photo ou dégradé), accroche et bouton RDV. Sert la galerie
 * « exemples de sites » des réalisations.
 */
type Props = {
  profession: string;
  url: string;
  tagline: string;
  /** Photo de hero (dans /public). Si absent → dégradé. */
  image?: string;
  /** Couleur d'accent (hex) pour le bouton et les détails. */
  accent?: string;
};

export default function MiniSite({
  profession,
  url,
  tagline,
  image,
  accent = "#2563EB",
}: Props) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-transform duration-500 ease-out hover:-translate-y-1.5">
      {/* Barre navigateur */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 flex-1 truncate rounded bg-paper px-2 py-0.5 text-[9px] text-mut">
          {url}
        </span>
      </div>
      {/* Hero */}
      <div className="relative h-32 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={`Exemple de site — ${profession}`}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${accent}, #0a1430)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <p className="font-display text-sm font-bold leading-tight text-white drop-shadow">
            {profession}
          </p>
          <p className="mt-0.5 text-[10px] text-white/80">{tagline}</p>
          <span
            className="mt-2 inline-block rounded-full px-2.5 py-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: accent }}
          >
            Prendre rendez-vous
          </span>
        </div>
      </div>
      {/* Faux contenu */}
      <div className="space-y-2 p-3">
        <div className="h-1.5 w-2/3 rounded bg-ink/15" />
        <div className="h-1.5 w-full rounded bg-ink/10" />
        <div className="h-1.5 w-4/5 rounded bg-ink/10" />
        <div className="flex gap-1.5 pt-1">
          <span className="h-5 flex-1 rounded-md border border-line bg-paper" />
          <span
            className="h-5 w-12 rounded-md"
            style={{ backgroundColor: `${accent}22` }}
          />
        </div>
      </div>
    </div>
  );
}
