import { getAllCalls, getAllProspects, indexProspects } from "@/lib/crmData";
import JournalList, { type JournalGroup } from "@/components/crm/JournalList";

export const dynamic = "force-dynamic";

function dayKey(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default async function JournalPage() {
  const [calls, prospects] = await Promise.all([getAllCalls(), getAllProspects()]);
  const map = indexProspects(prospects);

  // dernier appel + nombre d'appels par prospect
  const last = new Map<string, (typeof calls)[number]>();
  const counts = new Map<string, number>();
  for (const c of calls) {
    counts.set(c.prospect_id, (counts.get(c.prospect_id) ?? 0) + 1);
    if (!last.has(c.prospect_id)) last.set(c.prospect_id, c); // calls triés du + récent au + ancien
  }
  const entries = [...last.values()]
    .filter((c) => map.has(c.prospect_id))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  // regroupement par jour de dernier contact
  const groups: JournalGroup[] = [];
  for (const c of entries) {
    const p = map.get(c.prospect_id)!;
    const k = dayKey(c.created_at);
    let g = groups.find((x) => x.day === k);
    if (!g) { g = { day: k, items: [] }; groups.push(g); }
    g.items.push({
      call: c,
      prospect: p,
      count: counts.get(c.prospect_id) ?? 1,
    });
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
        <JournalList groups={groups} />
      )}
    </div>
  );
}
