import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Réservez un appel découverte de 15 minutes pour voir si Neela peut remplir l'agenda de votre centre.",
};

export default function ContactPage() {
  const tel = SITE.phone.replace(/\s/g, "");
  return (
    <div className="container-wide grid gap-16 pt-40 pb-32 md:grid-cols-[1fr_1fr]">
      <div>
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Contact
        </p>
        <h1 className="font-display text-[clamp(2.2rem,5.5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          Parlons de votre agenda.
        </h1>
        <p className="mt-6 max-w-md text-lg text-mut">
          Un échange de 15 minutes, sans engagement. On regarde ensemble votre
          zone, vos créneaux, et si nos campagnes ont du sens pour vous.
        </p>
        <div className="mt-10 space-y-2 text-[15px]">
          <a
            href={`mailto:${SITE.email}`}
            className="block font-display text-xl font-bold hover:text-accent"
          >
            {SITE.email}
          </a>
          {SITE.phone && (
            <a href={`tel:${tel}`} className="block text-lg font-semibold hover:text-accent">
              {SITE.phone}
            </a>
          )}
          <p className="text-mut">{SITE.city}</p>
        </div>
      </div>

      <ContactForm />
    </div>
  );
}
