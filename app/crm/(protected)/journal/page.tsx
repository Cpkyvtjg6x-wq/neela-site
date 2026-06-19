import Link from "next/link";
import { Mic } from "lucide-react";
import { getAllCalls, getAllProspects, indexProspects } from "@/lib/crmData";
import type { Call } from "@/lib/crm";
import { outcomeLabel, interetMeta } from "@/lib/crm";
import Tag from "@/components/crm/Tag";

export const dynamic = "force-dynamic";

function dayKey(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default async function JournalPage() {
  const [calls, prospects] = await Promise.all([getAllCalls(), getAllProspects()]);
  const map = indexProspects(prospects);

  // dernier appel + nombre d'appels par prospect
  const last = new Map<string, Call>();
  const counts = new Map<string, number>();
  for (const c of calls) {
    counts.set(c.prospect_id, (counts.get(c.prospect_id) ?? 0) + 1);
    if (!last.has(c.prospect_id)) last.set(c.prospect_id, c); // calls triés du + récent au + ancien
  }
  const entries = [...last.values()]
    .filter((c) => map.has(c.prospect_id))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  // regroupement par jour de dernier contact
  const groups: { day: string; items: Call[] }[] = [];
  for (const c of entries) {
    const k = dayKey(c.created_at);
    let g = groups.find((x) => x.day === k);
    if (!g) { g = { day: k, items: [] }; groups.push(g); }
    g.items.push(c);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Journal — prospects contactés</h1>
        <p className="mt-1 text-sm text-mut">{entries.length} prospect(s) contacté(s)</p>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-mut">
          Aucun prospect contacté pour l'instant.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <div key={g.day}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-mut">{g.day}</h2>
              <div className="space-y-2.5">
                {g.items.map((c) => {
                  const p = map.get(c.prospect_id)!;
                  const im = interetMeta(p.interet);
                  const n = counts.get(c.prospect_id) ?? 1;
                  return (
                    <Link key={c.id} href={`/crm/prospect/${p.id}`}
                      className="block rounded-2xl border border-line bg-white p-4 transition-colors hover:border-ink">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: im?.color ?? "#cbd5e1" }} />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{p.nom}</span>
                        <span className="shrink-0 rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium text-mut">
                          {outcomeLabel(c.outcome)}
                        </span>
                      </div>
                      {c.notes && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[13px] text-ink/75">{c.notes}</p>}
                      {c.tags && c.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">{c.tags.map((t) => <Tag key={t} label={t} hash />)}</div>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[12px] text-mut">
                        {c.recording_path && <span className="inline-flex items-center gap-1 text-accent"><Mic size={13} /> audio</span>}
                        <span>{p.ville}</span>
                        <span>· {n} appel{n > 1 ? "s" : ""}</span>
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
