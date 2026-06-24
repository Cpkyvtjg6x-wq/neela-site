import Image from "next/image";

// Maquette d'une story Instagram/Facebook (présentation, sans JS).
// La photo reste 100 % nette : le texte vit dans une barre-légende sous l'image.
type Props = {
  handle?: string;
  title: string;
  subtitle: string;
  cta?: string;
  /** Photo de fond (dans /public). Si absent, on retombe sur l'ancien dégradé + équaliseur. */
  image?: string;
  alt?: string;
};

export default function PhoneStory({
  handle = "votre.centre",
  title,
  subtitle,
  cta = "Je réserve",
  image,
  alt,
}: Props) {
  return (
    <div className="group w-[236px] shrink-0 overflow-hidden rounded-[34px] border border-white/10 bg-[#0a1430] p-2.5 shadow-float">
      <div className="overflow-hidden rounded-[26px] bg-[#0a1430]">
        {/* Zone image — aucune écriture sur la photo */}
        <div className="relative h-[300px] overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={alt ?? title}
              fill
              sizes="236px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-b from-accent via-[#1e3a8a] to-ink">
              <div className="flex h-[52px] items-end gap-1.5" aria-hidden>
                {["0s", "0.15s", "0.3s", "0.45s", "0.6s"].map((d, i) => (
                  <span
                    key={i}
                    className="eqbar bg-white/90"
                    style={{ animationDelay: d }}
                  />
                ))}
              </div>
            </div>
          )}
          {/* Léger voile haut pour les éléments d'interface */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
          {/* Barres de story (chrome d'interface) */}
          <div className="absolute inset-x-3 top-3 flex gap-1">
            <span className="h-[3px] flex-1 rounded bg-white" />
            <span className="h-[3px] flex-1 rounded bg-white/40" />
            <span className="h-[3px] flex-1 rounded bg-white/40" />
          </div>
          {/* Compte */}
          <div className="absolute left-3 top-7 flex items-center gap-2 text-[12px] font-bold text-white drop-shadow">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[10px]">
              N
            </span>
            {handle}
          </div>
        </div>

        {/* Barre-légende : le texte est ici, sur une surface UI (pas sur l'image) */}
        <div className="bg-[#0a1430] px-4 pb-4 pt-3.5 text-white">
          <h4 className="font-display text-[19px] font-bold leading-tight">
            {title}
          </h4>
          <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-white/70">
            {subtitle}
          </p>
          <div className="mt-3.5 rounded-full bg-white py-2.5 text-center text-[13px] font-bold text-[#0a1430] transition-colors group-hover:bg-accent group-hover:text-white">
            {cta}
          </div>
        </div>
      </div>
    </div>
  );
}
