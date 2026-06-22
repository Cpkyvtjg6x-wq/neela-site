import Link from "next/link";
import { Users, PhoneCall, CalendarCheck, Trophy } from "lucide-react";
import { getAllProspects, getAllCalls, getAppointments } from "@/lib/crmData";
import { statutLabel, STATUTS } from "@/lib/crm";

export const dynamic = "force-dynamic";

const RDV_STATUTS = new Set(["r1_pose", "rdv_honore", "proposition", "signe"]);
const parisDay = (d: string | Date) => new Date(d).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const ddmm = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`;

const SOURCE_LABELS: Record<string, string> = { sortant: "Sortant (démarchage)", site: "Site / entrant", manuel: "Manuel" };

export default async function StatsPage() {
  const [prospects, calls, appts] = await Promise.all([getAllProspects(), getAllCalls(), getAppointments()]);

  const total = prospects.length;
  const contacted = new Set(calls.map((c) => c.prospect_id).filter(Boolean)).size;
  const rdv = prospects.filter((p) => RDV_STATUTS.has(p.statut)).length;
  const signes = prospects.filter((p) => p.statut === "signe").length;

  // Entonnoir
  const funnel = [
    { label: "Prospects", value: total, color: "#0a0a0a" },
    { label: "Contactés", value: contacted, color: "#2563eb" },
    { label: "RDV obtenus", value: rdv, color: "#7c3aed" },
    { label: "Signés", value: signes, color: "#059669" },
  ];

  // Appels par jour (30 derniers jours, Europe/Paris)
  const now = new Date();
  const dayKeys: string[] = [];
  for (let k = 29; k >= 0; k--) {
    const d = new Date(now);
    d.setDate(d.getDate() - k);
    dayKeys.push(parisDay(d));
  }
  const callCount: Record<string, number> = {};
  for (const c of calls) {
    const k = parisDay(c.created_at);
    callCount[k] = (callCount[k] ?? 0) + 1;
  }
  const series = dayKeys.map((k) => ({ k, n: callCount[k] ?? 0 }));
  const maxN = Math.max(1, ...series.map((s) => s.n));
  const last7 = series.slice(-7).reduce((s, x) => s + x.n, 0);
  const last30 = series.reduce((s, x) => s + x.n, 0);
  const todayKey = parisDay(now);
  const callsToday = callCount[todayKey] ?? 0;

  // Par source
  const bySource = new Map<string, { total: number; rdv: number; signes: number }>();
  for (const p of prospects) {
    const s = p.source || "—";
    const o = bySource.get(s) ?? { total: 0, rdv: 0, signes: 0 };
    o.total++;
    if (RDV_STATUTS.has(p.statut)) o.rdv++;
    if (p.statut === "signe") o.signes++;
    bySource.set(s, o);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1].total - a[1].total);

  // Répartition par statut
  const statutCounts = STATUTS.map((s) => ({ ...s, n: prospects.filter((p) => p.statut === s.key).length }));
  const maxStatut = Math.max(1, ...statutCounts.map((s) => s.n));

  const rdvAvenir = appts.filter((a) => a.status === "reserve" && new Date(a.start_at) >= now).length;

  const kpis = [
    { label: "Prospects", value: total, sub: `${rdvAvenir} RDV à venir`, icon: Users, color: "#2563eb" },
    { label: "Taux de contact", value: `${pct(contacted, total)} %`, sub: `${contacted} contactés`, icon: PhoneCall, color: "#0a0a0a" },
    { label: "Taux de RDV", value: `${pct(rdv, contacted)} %`, sub: `${rdv} RDV (des contactés)`, icon: CalendarCheck, color: "#7c3aed" },
    { label: "Taux de closing", value: `${pct(signes, rdv)} %`, sub: `${signes} signés (des RDV)`, icon: Trophy, color: "#059669" },
  ];

  const card = "rounded-2xl border border-line bg-white p-5";

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-sm text-mut">Pilotage de la prospection : conversion, activité d'appel, sources.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={card}>
              <Icon size={20} style={{ color: k.color }} />
              <p className="mt-3 font-display text-3xl font-bold">{k.value}</p>
              <p className="text-sm text-mut">{k.label}</p>
              <p className="mt-0.5 text-[11px] text-mut">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Entonnoir */}
        <div className={card}>
          <h2 className="mb-4 font-display text-lg font-bold">Entonnoir de conversion</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const prev = i === 0 ? f.value : funnel[i - 1].value;
              const widthPct = total > 0 ? Math.max(4, (f.value / total) * 100) : 4;
              return (
                <div key={f.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{f.label}</span>
                    <span className="text-mut">
                      <b className="text-ink">{f.value}</b>
                      {i > 0 && <span className="ml-2 text-[12px]">({pct(f.value, prev)}% de l'étape préc.)</span>}
                    </span>
                  </div>
                  <div className="h-7 overflow-hidden rounded-lg bg-paper">
                    <div className="flex h-full items-center rounded-lg pl-2 text-[11px] font-bold text-white" style={{ width: `${widthPct}%`, background: f.color }}>
                      {total > 0 ? `${pct(f.value, total)}%` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appels par jour */}
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Appels — 30 derniers jours</h2>
            <span className="text-xs text-mut">Auj. <b className="text-ink">{callsToday}</b> · 7j <b className="text-ink">{last7}</b> · 30j <b className="text-ink">{last30}</b></span>
          </div>
          <div className="flex h-32 items-end gap-[3px]">
            {series.map((s) => (
              <div key={s.k} className="group relative flex-1" title={`${ddmm(s.k)} : ${s.n} appel${s.n > 1 ? "s" : ""}`}>
                <div className="w-full rounded-t bg-accent transition-colors group-hover:bg-ink" style={{ height: `${(s.n / maxN) * 100}%`, minHeight: s.n > 0 ? 3 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-mut">
            <span>{ddmm(series[0].k)}</span>
            <span>{ddmm(series[Math.floor(series.length / 2)].k)}</span>
            <span>{ddmm(series[series.length - 1].k)}</span>
          </div>
        </div>

        {/* Par source */}
        <div className={card}>
          <h2 className="mb-4 font-display text-lg font-bold">Par source</h2>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-paper text-left text-[11px] uppercase tracking-wide text-mut">
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 text-right font-semibold">Prospects</th>
                  <th className="px-3 py-2 text-right font-semibold">RDV</th>
                  <th className="px-3 py-2 text-right font-semibold">Signés</th>
                  <th className="px-3 py-2 text-right font-semibold">Taux RDV</th>
                </tr>
              </thead>
              <tbody>
                {sources.map(([s, o]) => (
                  <tr key={s} className="border-t border-line">
                    <td className="px-3 py-2 font-medium">{SOURCE_LABELS[s] ?? s}</td>
                    <td className="px-3 py-2 text-right">{o.total}</td>
                    <td className="px-3 py-2 text-right">{o.rdv}</td>
                    <td className="px-3 py-2 text-right">{o.signes}</td>
                    <td className="px-3 py-2 text-right font-semibold text-accent">{pct(o.rdv, o.total)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-mut">
            Le <b>coût par RDV</b> nécessite le budget publicitaire : il est simulé dans l'<Link href="/crm/ad-planner" className="text-accent hover:underline">Ad Planner</Link>.
          </p>
        </div>

        {/* Répartition par statut */}
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Répartition par statut</h2>
            <Link href="/crm/pipeline" className="text-sm text-accent hover:underline">Pipeline →</Link>
          </div>
          <div className="space-y-1">
            {statutCounts.map((s) => (
              <Link key={s.key} href="/crm/pipeline" className="-mx-1 flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-paper">
                <span className="w-28 shrink-0 text-sm text-mut">{statutLabel(s.key)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(s.n / maxStatut) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold">{s.n}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
