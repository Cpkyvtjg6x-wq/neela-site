import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/supabaseAdmin";
import type { Prospect, Call } from "@/lib/crm";
import { STATUTS, OUTCOMES, INTERETS, outcomeLabel, interetMeta } from "@/lib/crm";
import { updateProspect, addCall } from "@/app/crm/actions";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProspectPage({
  params,
}: {
  params: { id: string };
}) {
  const db = getDb();
  const { data: prospect } = await db
    .from("neela_prospects")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!prospect) notFound();
  const p = prospect as Prospect;

  const { data: callsData } = await db
    .from("neela_calls")
    .select("*")
    .eq("prospect_id", params.id)
    .order("created_at", { ascending: false });
  const calls = (callsData ?? []) as Call[];

  const im = interetMeta(p.interet);
  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <div>
      <Link href="/crm/prospects" className="text-sm text-mut hover:text-accent">
        ← Tous les prospects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {im && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                style={{ background: im.color }}
              >
                {im.label}
              </span>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {p.nom}
            </h1>
          </div>
          <p className="mt-1 text-sm text-mut">
            {p.ville} ({p.departement}) · {p.centre}
          </p>
        </div>
        {p.telephone && (
          <a
            href={`tel:${p.telephone.replace(/\s/g, "")}`}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent"
          >
            Appeler {p.telephone}
          </a>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Colonne gauche : fiche éditable + nouvel appel */}
        <div className="space-y-6">
          {/* Fiche */}
          <form
            action={updateProspect}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <input type="hidden" name="id" value={p.id} />
            <h2 className="mb-4 font-display text-lg font-bold">Fiche</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className={label}>Téléphone</p>
                <input name="telephone" defaultValue={p.telephone ?? ""} className={field} />
              </div>
              <div>
                <p className={label}>Email</p>
                <input name="email" defaultValue={p.email ?? ""} className={field} />
              </div>
              <div>
                <p className={label}>Statut</p>
                <select name="statut" defaultValue={p.statut} className={field}>
                  {STATUTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={label}>Intérêt</p>
                <select name="interet" defaultValue={p.interet ?? ""} className={field}>
                  <option value="">—</option>
                  {INTERETS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <p className={label}>Notes</p>
              <textarea
                name="notes"
                defaultValue={p.notes ?? ""}
                rows={6}
                className={field}
              />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent"
            >
              Enregistrer la fiche
            </button>
          </form>

          {/* Nouvel appel */}
          <form
            action={addCall}
            className="rounded-2xl border border-line bg-white p-5"
          >
            <input type="hidden" name="prospect_id" value={p.id} />
            <h2 className="mb-4 font-display text-lg font-bold">
              Enregistrer un appel
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className={label}>Résultat</p>
                <select name="outcome" defaultValue="" className={field}>
                  <option value="">—</option>
                  {OUTCOMES.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={label}>Rappel le</p>
                <input type="datetime-local" name="rappel_at" className={field} />
              </div>
              <div>
                <p className={label}>Nouveau statut</p>
                <select name="statut" defaultValue="" className={field}>
                  <option value="">(inchangé)</option>
                  {STATUTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={label}>Nouvel intérêt</p>
                <select name="interet" defaultValue="" className={field}>
                  <option value="">(inchangé)</option>
                  {INTERETS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <p className={label}>Notes d'appel</p>
              <textarea name="notes" rows={3} className={field} />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Ajouter l'appel
            </button>
          </form>
        </div>

        {/* Colonne droite : historique */}
        <div>
          <h2 className="mb-4 font-display text-lg font-bold">
            Historique des appels
          </h2>
          {calls.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mut">
              Aucun appel enregistré pour l'instant.
            </p>
          ) : (
            <div className="space-y-3">
              {calls.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-line bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink">
                      {outcomeLabel(c.outcome)}
                    </span>
                    <span className="text-[12px] text-mut">
                      {fmt(c.created_at)}
                    </span>
                  </div>
                  {c.notes && (
                    <p className="mt-2 whitespace-pre-wrap text-[13px] text-ink/80">
                      {c.notes}
                    </p>
                  )}
                  {c.rappel_at && (
                    <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700">
                      Rappel : {fmt(c.rappel_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
