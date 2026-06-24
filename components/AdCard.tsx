import Image from "next/image";

// Maquette d'une publicité Facebook (présentation, sans JS).
type Props = {
  page?: string;
  primary: string;
  /** Conservé pour compatibilité — plus affiché sur l'image (aucun texte « cuit »). */
  label?: string;
  domain?: string;
  headline: string;
  cta?: string;
  /** Photo de fond (dans /public). Si absent, on retombe sur l'ancien dégradé + équaliseur. */
  image?: string;
  /** Texte alternatif de l'image, pour l'accessibilité. */
  alt?: string;
  /** Initiale ou court label affiché dans l'avatar rond de la page. */
  avatar?: string;
};

function Wave() {
  // Équaliseur animé (CSS pur) — fallback quand il n'y a pas de photo.
  const delays = ["0s", "0.1s", "0.2s", "0.3s", "0.4s", "0.5s", "0.6s"];
  return (
    <div className="flex h-[52px] items-end gap-1.5" aria-hidden>
      {delays.map((d, i) => (
        <span
          key={i}
          className="eqbar bg-white/90"
          style={{ animationDelay: d }}
        />
      ))}
    </div>
  );
}

export default function AdCard({
  page = "Votre centre",
  primary,
  domain = "votre-centre.fr",
  headline,
  cta = "Réserver",
  image,
  alt,
  avatar = "N",
}: Props) {
  return (
    <div className="group w-[320px] shrink-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-transform duration-500 ease-out hover:-translate-y-1.5">
      {/* En-tête */}
      <div className="flex items-center gap-2.5 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-ink font-display text-sm font-bold text-white">
          {avatar}
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-bold text-black">{page}</p>
          <p className="text-[11px] text-mut">Sponsorisé</p>
        </div>
      </div>

      {/* Texte */}
      <p className="px-3 pb-2.5 text-[13px] leading-snug text-black/80">
        {primary}
      </p>

      {/* Média — image 100 % propre, aucun texte superposé */}
      <div className="relative h-[220px] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={alt ?? page}
            fill
            sizes="320px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1e3a8a] via-accent to-[#5AA0FF]">
            <Wave />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_80%_10%,rgba(255,255,255,0.22),transparent_50%)]" />
          </div>
        )}
      </div>

      {/* Lien */}
      <div className="flex items-center gap-3 border-t border-line bg-[#f6f8fb] p-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-mut">
            {domain}
          </p>
          <p className="truncate font-display text-[13px] font-bold text-black">
            {headline}
          </p>
        </div>
        <span className="ml-auto whitespace-nowrap rounded-lg bg-[#e6eaf0] px-3 py-2 text-[12px] font-bold text-black">
          {cta}
        </span>
      </div>

      {/* Engagement */}
      <div className="flex justify-around border-t border-line py-2.5 text-[12px] font-semibold text-mut">
        <span>👍 J&apos;aime</span>
        <span>💬 Commenter</span>
        <span>↗ Partager</span>
      </div>
    </div>
  );
}
