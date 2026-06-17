"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitContact, type ContactState } from "@/app/(site)/contact/actions";

const initial: ContactState = { ok: false, error: null };
const field =
  "mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] outline-none focus:border-accent";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Envoyer ma demande"}
    </button>
  );
}

export default function ContactForm() {
  const [state, action] = useFormState(submitContact, initial);

  if (state.ok) {
    return (
      <div className="flex flex-col justify-center rounded-3xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl font-bold">Merci !</p>
        <p className="mt-3 text-mut">
          Votre demande est bien reçue. On vous recontacte très vite pour caler
          votre échange.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-line p-8">
      <div className="space-y-5">
        <div>
          <label htmlFor="nom" className="text-sm font-medium text-mut">Votre nom *</label>
          <input id="nom" name="nom" type="text" required className={field} />
        </div>
        <div>
          <label htmlFor="centre" className="text-sm font-medium text-mut">Nom du centre</label>
          <input id="centre" name="centre" type="text" className={field} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-mut">Email *</label>
          <input id="email" name="email" type="email" required className={field} />
        </div>
        <div>
          <label htmlFor="telephone" className="text-sm font-medium text-mut">Téléphone</label>
          <input id="telephone" name="telephone" type="tel" className={field} />
        </div>
        <div>
          <label htmlFor="message" className="text-sm font-medium text-mut">Message</label>
          <textarea id="message" name="message" rows={4} className={field} />
        </div>
        {state.error && (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        )}
        <SubmitButton />
      </div>
    </form>
  );
}
