import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegales() {
  return (
    <div className="container-wide max-w-3xl pt-40 pb-32">
      <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-[-0.03em]">
        Mentions légales
      </h1>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/85">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Éditeur du site</h2>
          <p className="mt-2">
            Le site {SITE.url.replace("https://", "")} est édité par [Ton nom / Raison sociale],
            [statut : micro-entreprise / EI / SASU], SIREN [à compléter], dont le siège est à {SITE.city}.<br />
            Email : {SITE.email} · Téléphone : {SITE.phone}<br />
            Directeur de la publication : [Ton nom].<br />
            TVA : [n° intracommunautaire — ou « TVA non applicable, art. 293 B du CGI »].
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Hébergement</h2>
          <p className="mt-2">
            Site hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).
            Base de données hébergée par Supabase (région Europe — Francfort, Allemagne).
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Propriété intellectuelle</h2>
          <p className="mt-2">
            L'ensemble du contenu de ce site (textes, visuels, logo Neela, charte graphique) est la
            propriété exclusive de l'éditeur. Toute reproduction sans autorisation est interdite.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Contact</h2>
          <p className="mt-2">Pour toute question : {SITE.email}</p>
        </section>
      </div>
    </div>
  );
}
