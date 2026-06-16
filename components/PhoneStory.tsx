// Maquette d'une story Instagram (présentation, sans JS).
type Props = {
  handle?: string;
  title: string;
  subtitle: string;
  cta?: string;
};

export default function PhoneStory({
  handle = "votre.centre",
  title,
  subtitle,
  cta = "Je réserve",
}: Props) {
  return (
    <div className="w-[230px] shrink-0 rounded-[34px] border border-white/10 bg-[#0a1430] p-2.5 shadow-float">
      <div className="relative flex h-[460px] flex-col justify-end overflow-hidden rounded-[26px] bg-gradient-to-b from-accent via-[#1e3a8a] to-ink p-5">
        {/* Barres de story */}
        <div className="absolute inset-x-4 top-3 flex gap-1">
          <span className="h-[3px] flex-1 rounded bg-white" />
          <span className="h-[3px] flex-1 rounded bg-white/35" />
          <span className="h-[3px] flex-1 rounded bg-white/35" />
        </div>
        {/* Compte */}
        <div className="absolute left-4 top-7 flex items-center gap-2 text-[12px] font-bold text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[10px]">
            N
          </span>
          {handle}
        </div>
        {/* Équaliseur central */}
        <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-[52px] items-end gap-1.5" aria-hidden>
            {["0s", "0.15s", "0.3s", "0.45s", "0.6s"].map((d, i) => (
              <span key={i} className="eqbar bg-white/90" style={{ animationDelay: d }} />
            ))}
          </div>
        </div>
        {/* Texte */}
        <h4 className="relative z-10 font-display text-2xl font-bold leading-tight text-white">
          {title}
        </h4>
        <p className="relative z-10 mt-2 text-[13px] font-medium text-white/85">
          {subtitle}
        </p>
        <div className="relative z-10 mt-4 rounded-full bg-white py-2.5 text-center text-[13px] font-bold text-[#0a1430]">
          {cta}
        </div>
      </div>
    </div>
  );
}
