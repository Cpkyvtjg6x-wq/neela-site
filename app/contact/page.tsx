import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Réservez un appel découverte de 15 minutes pour voir si Neela peut remplir l'agenda de votre centre.",
};

export default function ContactPage() {
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
          <p className="text-mut">{SITE.city}</p>
        </div>
      </div>

      {/* Formulaire élégant. Action mailto pour rester simple et sans backend. */}
      <form
        action={`mailto:${SITE.email}`}
        method="post"
        encType="text/plain"
        className="rounded-3xl border border-line p-8"
      >
        <div className="space-y-5">
          <div>
            <label htmlFor="nom" className="text-sm font-medium text-mut">
              Votre nom
            </label>
            <input
              id="nom"
              name="nom"
              type="text"
              required
              className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="centre" className="text-sm font-medium text-mut">
              Nom du centre
            </label>
            <input
              id="centre"
              name="centre"
              type="text"
              className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-mut">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium text-mut">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-accent"
          >
            Envoyer ma demande
          </button>
        </div>
      </form>
    </div>
  );
}
