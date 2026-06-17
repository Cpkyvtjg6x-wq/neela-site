import Link from "next/link";
import { SITE } from "@/lib/site";

const SOCIALS = [
  { label: "LinkedIn", href: SITE.socials.linkedin },
  { label: "Instagram", href: SITE.socials.instagram },
  { label: "Facebook", href: SITE.socials.facebook },
].filter((s) => s.href && s.href !== "#");

export default function Footer() {
  const tel = SITE.phone.replace(/\s/g, "");
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
              <li><Link href="/services" className="text-ink/80 hover:text-accent">Services</Link></li>
              <li><Link href="/realisations" className="text-ink/80 hover:text-accent">Réalisations</Link></li>
              <li><Link href="/contact" className="text-ink/80 hover:text-accent">Contact</Link></li>
              <li><Link href="/mentions-legales" className="text-ink/80 hover:text-accent">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="text-ink/80 hover:text-accent">Confidentialité</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mut">
              Contact
            </p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li><a href={`mailto:${SITE.email}`} className="text-ink/80 hover:text-accent">{SITE.email}</a></li>
              {SITE.phone && (
                <li><a href={`tel:${tel}`} className="text-ink/80 hover:text-accent">{SITE.phone}</a></li>
              )}
              <li className="text-mut">{SITE.city}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-sm text-mut md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Neela. Tous droits réservés.</p>
          {SOCIALS.length > 0 && (
            <div className="flex gap-5">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} className="hover:text-accent">{s.label}</a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
