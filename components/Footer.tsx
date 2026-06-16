import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="container-wide py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              Neela
            </Link>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-mut">
              {SITE.tagline}. Nous remplissons l'agenda des centres de santé
              indépendants.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mut">
              Navigation
            </p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li>
                <Link href="/services" className="text-ink/80 hover:text-accent">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/realisations" className="text-ink/80 hover:text-accent">
                  Réalisations
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-ink/80 hover:text-accent">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mut">
              Contact
            </p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li>
                <a href={`mailto:${SITE.email}`} className="text-ink/80 hover:text-accent">
                  {SITE.email}
                </a>
              </li>
              <li className="text-mut">{SITE.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-sm text-mut md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Neela. Tous droits réservés.</p>
          <div className="flex gap-5">
            <a href={SITE.socials.linkedin} className="hover:text-accent">LinkedIn</a>
            <a href={SITE.socials.instagram} className="hover:text-accent">Instagram</a>
            <a href={SITE.socials.facebook} className="hover:text-accent">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
