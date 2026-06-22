import { getAllProspects, getAllCalls, getRappels, indexProspects } from "@/lib/crmData";
import type { Call } from "@/lib/crm";
import RelancesList, { type RelanceItem } from "@/components/crm/RelancesList";

export const dynamic = "force-dynamic";

const parisDay = (d: string | Date) => new Date(d).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const fmtRappel = (iso: string) => new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export default async function RelancesPage() {
  const now = new Date();
  const bound = new Date(now.getTime() + 2 * 86400000).toISOString();
  const [prospects, rappelCalls, allCalls] = await Promise.all([getAllProspects(), getRappels(bound), getAllCalls()]);
  const map = indexProspects(prospects);
  const todayKey = parisDay(now);

  // Dernier appel + prospects ayant un rappel futur (déjà planifié → on ne les liste pas).
  const lastCall = new Map<string, Call>();
  const futureRappel = new Set<string>();
  for (const c of allCalls) {
    if (c.prospect_id && !lastCall.has(c.prospect_id)) lastCall.set(c.prospect_id, c);
    if (c.prospect_id && c.rappel_at && parisDay(c.rappel_at) > todayKey) futureRappel.add(c.prospect_id);
  }

  const overdue: RelanceItem[] = [];
  const today: RelanceItem[] = [];
  for (const c of rappelCalls) {
    if (!c.prospect_id || !c.rappel_at) continue;
    const p = map.get(c.prospect_id);
    if (!p) continue;
    const dk = parisDay(c.rappel_at);
    if (dk < todayKey) overdue.push({ key: `o-${c.id}`, prospect: p, reason: `En retard — ${fmtRappel(c.rappel_at)}`, callId: c.id, kind: "overdue" });
    else if (dk === todayKey) today.push({ key: `t-${c.id}`, prospect: p, reason: `Aujourd'hui — ${fmtRappel(c.rappel_at)}`, callId: c.id, kind: "today" });
  }

  // Propositions envoyées sans suite depuis ≥ 3 jours (et sans rappel déjà programmé).
  const shown = new Set([...overdue, ...today].map((i) => i.prospect.id));
  const daysSince = (iso: string) => Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  const propositions: RelanceItem[] = prospects
    .filter((p) => p.statut === "proposition" && !shown.has(p.id) && !futureRappel.has(p.id))
    .map((p) => ({ p, last: lastCall.get(p.id) }))
    .filter(({ last }) => (last ? daysSince(last.created_at) : 999) >= 3)
    .sort((a, b) => (a.last ? +new Date(a.last.created_at) : 0) - (b.last ? +new Date(b.last.created_at) : 0))
    .map(({ p, last }) => ({
      key: `p-${p.id}`,
      prospect: p,
      reason: last ? `Proposition — dernier contact il y a ${daysSince(last.created_at)} j` : "Proposition — à relancer",
      kind: "proposition" as const,
    }));

  const totalCount = overdue.length + today.length + propositions.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">À relancer</h1>
        <p className="mt-1 text-sm text-mut">{totalCount} relance(s) à traiter · rappels échus, du jour, et propositions en attente.</p>
      </div>
      <RelancesList overdue={overdue} today={today} propositions={propositions} />
    </div>
  );
}
