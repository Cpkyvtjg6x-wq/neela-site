import Link from "next/link";
import { getAllCalls, getAllProspects, indexProspects } from "@/lib/crmData";
import { outcomeLabel } from "@/lib/crm";

export const dynamic = "force-dynamic";

function dayKey(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JournalPage() {
  const [calls, prospects] = await Promise.all([getAllCalls(), getAllProspects()]);
  const map = indexProspects(prospects);

  // Regroupement par jour (calls déjà triés du + récent au + ancien)
  const groups: { day: string; items: typeof calls }[] = [];
  for (const c of calls) {
    const k = dayKey(c.created_at);
    let g = groups.find((x) => x.day === k);
    if (!g) {
      g = { day: k, items: [] };
      groups.push(g);
    }
    g.items.push(c);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Journal d'appels
        </h1>
        <p className="mt-1 text-sm text-mut">{calls.length} appel(s) enregistré(s)</p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-mut">
          Aucun appel enregistré pour l'instant. Ouvre une fiche prospect pour en
          ajouter un.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <div key={g.day}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-mut">
                {g.day}
              </h2>
              <div className="space-y-2.5">
                {g.items.map((c) => {
                  const p = map.get(c.prospect_id);
                  return (
                    <Link
                      key={c.id}
                      href={p ? `/crm/prospect/${p.id}` : "/crm"}
                      className="block rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-[15px] font-semibold">
                          {p?.nom ?? "Prospect"}
                        </span>
                        <span className="shrink-0 rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium text-mut">
                          {outcomeLabel(c.outcome)}
                        </span>
                      </div>
                      {c.notes && (
                        <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[13px] text-ink/75">
                          {c.notes}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[12px] text-mut">
                        <span>
                          {new Date(c.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {p?.ville && <span>· {p.ville}</span>}
                        {c.rappel_at && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                            Rappel {new Date(c.rappel_at).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
