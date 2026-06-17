import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Confidentialite() {
  return (
    <div className="container-wide max-w-3xl pt-40 pb-32">
      <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold tracking-[-0.03em]">
        Politique de confidentialité
      </h1>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/85">
        <p>
          Cette politique explique comment Neela collecte et utilise vos données personnelles sur ce
          site, conformément au RGPD.
        </p>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Données collectées</h2>
          <p className="mt-2">
            Uniquement les données que vous transmettez via le formulaire de contact ou la prise de
            rendez-vous : nom, email, téléphone, nom du centre, message. Aucune donnée sensible, aucun
            profilage.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Finalité &amp; conservation</h2>
          <p className="mt-2">
            Vos données servent uniquement à répondre à votre demande et organiser un échange. Elles
            sont conservées le temps nécessaire au traitement puis supprimées dans un délai maximum de
            36 mois.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Destinataires</h2>
          <p className="mt-2">
            Vos données sont traitées par l'éditeur et stockées chez notre sous-traitant technique
            Supabase (hébergement en Europe). Elles ne sont ni vendues ni cédées à des tiers.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Vos droits</h2>
          <p className="mt-2">
            Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et
            d'opposition. Pour les exercer : {SITE.email}. Vous pouvez aussi saisir la CNIL (cnil.fr).
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold text-ink">Cookies</h2>
          <p className="mt-2">
            Ce site n'utilise pas de cookies publicitaires ni de traceurs tiers.
          </p>
        </section>
      </div>
    </div>
  );
}
