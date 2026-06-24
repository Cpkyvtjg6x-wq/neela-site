import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Bloc « vivant » image + texte alterné — la brique de base de la landing.
 * `media` accueille indifféremment une photo encadrée, une maquette ou un
 * écran animé. `reverse` place le média à gauche.
 */
type Props = {
  eyebrow: string;
  title: string;
  accent?: string;
  text: string;
  bullets?: string[];
  cta?: { href: string; label: string };
  reverse?: boolean;
  media: React.ReactNode;
};

export default function FeatureRow({
  eyebrow,
  title,
  accent,
  text,
  bullets,
  cta,
  reverse,
  media,
}: Props) {
  return (
    <section className="container-wide py-20 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Média */}
        <Reveal className={reverse ? "lg:order-2" : ""}>
          <div>{media}</div>
        </Reveal>

        {/* Texte */}
        <Reveal delay={0.08} className={reverse ? "lg:order-1" : ""}>
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              {eyebrow}
            </p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,3.2rem)] font-bold leading-[1.05] tracking-[-0.03em]">
              {title}
              {accent && <span className="text-accent"> {accent}</span>}
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-mut">
              {text}
            </p>
            {bullets && bullets.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[15px] text-ink/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/12 text-[11px] font-bold text-accent">
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {cta && (
              <Link
                href={cta.href}
                data-cursor
                className="group mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink transition-colors hover:text-accent"
              >
                {cta.label}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
