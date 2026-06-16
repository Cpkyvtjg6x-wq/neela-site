"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";

const initial: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Se connecter"}
    </button>
  );
}

export default function CrmLogin() {
  const [state, formAction] = useFormState(login, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-display text-xl font-bold tracking-tight">
            Neela CRM
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Accès privé
        </h1>
        <p className="mt-2 text-[15px] text-mut">
          Entre ton mot de passe pour accéder à ta prospection.
        </p>

        <form action={formAction} className="mt-7 space-y-4">
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none focus:border-accent"
          />
          {state.error && (
            <p className="text-sm font-medium text-red-600">{state.error}</p>
          )}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
