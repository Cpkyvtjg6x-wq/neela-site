import Link from "next/link";
import { Flame, PhoneOutgoing, CalendarClock, Users, Plus } from "lucide-react";
import { getAllProspects, getAllCalls, getAppointments, indexProspects } from "@/lib/crmData";
import { STATUTS, statutLabel, regionForDept } from "@/lib/crm";

export const dynamic = "force-dynamic";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Paris",
  });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

export default async function Dashboard() {
  const [prospects, calls, appts] = await Promise.all([
    getAllProspects(),
    getAllCalls(),
    getAppointments(),
  ]);
  const map = indexProspects(prospects);

  const now = new Date();
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);

  const total = prospects.length;
  const chauds = prospects.filter((p) => p.interet === "chaud").length;
  const contactedSet = new Set(calls.map((c) => c.prospect_id));
  const aAppeler = prospects.filter((p) => !contactedSet.has(p.id)).length;

  const rappels = calls
    .filter((c) => c.rappel_at && new Date(c.rappel_at) <= endToday)
    .sort((a, b) => +new Date(a.rappel_at!) - +new Date(b.rappel_at!))
    .slice(0, 8);

  const prochainsRdv = appts
    .filter((a) => a.status === "reserve" && a.source !== "rappel" && new Date(a.start_at) >= new Date(now.toDateString()))
    .slice(0, 6);
  const rdvAvenir = appts.filter(
    (a) => a.status === "reserve" && a.source !== "rappel" && new Date(a.start_at) >= now
  ).length;

  const maxStatut = Math.max(
    1,
    ...STATUTS.map((s) => prospects.filter((p) => p.statut === s.key).length)
  );

  const regionCounts = new Map<string, number>();
  for (const p of prospects) {
    const r = regionForDept(p.departement);
    regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1);
  }
  const regions = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxRegion = Math.max(1, ...regions.map((r) => r[1]));

  const kpis = [
    { label: "Prospects", value: total, icon: Users, color: "#2563eb" },
    { label: "Chauds", value: chauds, icon: Flame, color: "#dc2626" },
    { label: "À appeler", value: aAppeler, icon: PhoneOutgoing, color: "#0a0a0a" },
    { label: "RDV à venir", value: rdvAvenir, icon: CalendarClock, color: "#059669" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <Link
          href="/crm/prospects/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent"
        >
          <Plus size={16} /> Nouveau prospect
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl border border-line bg-white p-5">
              <Icon size={20} style={{ color: k.color }} />
              <p className="mt-3 font-display text-3xl font-bold">{k.value}</p>
              <p className="text-sm text-mut">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Rappels à traiter */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Rappels à traiter</h2>
          {rappels.length === 0 ? (
            <p className="text-sm text-mut">Aucun rappel en attente.</p>
          ) : (
            <ul className="space-y-2">
              {rappels.map((c) => {
                const p = map.get(c.prospect_id);
                const overdue = new Date(c.rappel_at!) < now;
                return (
                  <li key={c.id}>
                    <Link
                      href={p ? `/crm/prospect/${p.id}` : "/crm"}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-paper"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          overdue ? "bg-red-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {p?.nom ?? "Prospect"}
                      </span>
                      <span className={`text-xs ${overdue ? "text-red-600" : "text-mut"}`}>
                        {fmtDate(c.rappel_at!)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Prochains RDV */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Prochains rendez-vous</h2>
            <Link href="/crm/agenda" className="text-sm text-accent hover:underline">
              Agenda →
            </Link>
          </div>
          {prochainsRdv.length === 0 ? (
            <p className="text-sm text-mut">Aucun rendez-vous à venir.</p>
          ) : (
            <ul className="space-y-2">
              {prochainsRdv.map((a) => {
                const p = a.prospect_id ? map.get(a.prospect_id) : null;
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-xs font-bold text-accent">{fmtDate(a.start_at)}</p>
                      <p className="text-xs text-mut">{fmtTime(a.start_at)}</p>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {a.name || p?.nom || "Rendez-vous"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pipeline */}
        <div className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Pipeline</h2>
          <div className="space-y-2.5">
            {STATUTS.map((s) => {
              const n = prospects.filter((p) => p.statut === s.key).length;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-mut">{statutLabel(s.key)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(n / maxStatut) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Par région */}
        <div className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Par région</h2>
          <div className="space-y-2.5">
            {regions.map(([r, n]) => (
              <div key={r} className="flex items-center gap-3">
                <span className="w-48 shrink-0 truncate text-sm text-mut">{r}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(n / maxRegion) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
