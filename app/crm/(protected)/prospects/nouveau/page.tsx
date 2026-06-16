import Link from "next/link";
import { INTERETS } from "@/lib/crm";
import { addProspect } from "@/app/crm/actions";

export const dynamic = "force-dynamic";

export default function NouveauProspect() {
  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <div className="max-w-2xl">
      <Link href="/crm/prospects" className="text-sm text-mut hover:text-accent">
        ← Prospects
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
        Nouveau prospect
      </h1>

      <form
        action={addProspect}
        className="mt-6 rounded-2xl border border-line bg-white p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className={label}>Nom du centre *</p>
            <input name="nom" required className={field} />
          </div>
          <div>
            <p className={label}>Enseigne / réseau</p>
            <input name="centre" className={field} />
          </div>
          <div>
            <p className={label}>Ville</p>
            <input name="ville" className={field} />
          </div>
          <div>
            <p className={label}>Département</p>
            <input name="departement" maxLength={3} className={field} />
          </div>
          <div>
            <p className={label}>Téléphone</p>
            <input name="telephone" className={field} />
          </div>
          <div>
            <p className={label}>Email</p>
            <input name="email" type="email" className={field} />
          </div>
          <div>
            <p className={label}>Intérêt</p>
            <select name="interet" defaultValue="" className={field}>
              <option value="">—</option>
              {INTERETS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <p className={label}>Notes</p>
            <textarea name="notes" rows={4} className={field} />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent"
        >
          Créer le prospect
        </button>
      </form>
    </div>
  );
}
