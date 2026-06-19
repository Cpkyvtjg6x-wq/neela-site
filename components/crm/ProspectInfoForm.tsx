"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/crm";
import { updateProspect } from "@/app/crm/actions";

export default function ProspectInfoForm({ p }: { p: Prospect }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("id", p.id);
    start(async () => {
      try {
        await updateProspect(fd);
        setMsg({ ok: true, text: "Modifications enregistrées." });
        router.refresh();
      } catch (err) {
        setMsg({ ok: false, text: (err as Error)?.message || "Erreur lors de l'enregistrement." });
      }
    });
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 font-display text-base font-bold">Fiche &amp; coordonnées</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className={label}>Nom</p>
          <input name="nom" defaultValue={p.nom ?? ""} className={field} />
        </div>
        <div>
          <p className={label}>Enseigne / réseau</p>
          <input name="centre" defaultValue={p.centre ?? ""} className={field} />
        </div>
        <div>
          <p className={label}>Téléphone</p>
          <input name="telephone" defaultValue={p.telephone ?? ""} className={field} />
        </div>
        <div>
          <p className={label}>Email</p>
          <input name="email" type="email" defaultValue={p.email ?? ""} className={field} />
        </div>
        <div>
          <p className={label}>Ville</p>
          <input name="ville" defaultValue={p.ville ?? ""} className={field} />
        </div>
        <div>
          <p className={label}>Département</p>
          <input name="departement" defaultValue={p.departement ?? ""} maxLength={3} className={field} />
        </div>
      </div>
      <div className="mt-3">
        <p className={label}>Notes / contexte</p>
        <textarea name="notes" defaultValue={p.notes ?? ""} rows={4} className={field} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:border-ink disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer la fiche"}
        </button>
        {msg && (
          <span className={`text-sm font-medium ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
