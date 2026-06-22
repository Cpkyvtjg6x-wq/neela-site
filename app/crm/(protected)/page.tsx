import Link from "next/link";
import {
  Flame, PhoneCall, CalendarClock, AlarmClock, Wallet, Plus, Headphones,
  Check, ArrowRight, Phone, TrendingUp,
} from "lucide-react";
import { getAllProspects, getAllCalls, getAppointments, getInvoices, indexProspects } from "@/lib/crmData";
import { STATUTS, statutLabel, regionForDept, prospectScore, scoreTier, interetMeta } from "@/lib/crm";
import { eur2 } from "@/lib/invoices";
import { telHref } from "@/lib/telephony";
import { clearRappel } from "@/app/crm/actions";
import OpenFicheLink from "@/components/crm/OpenFicheLink";

export const dynamic = "force-dynamic";

const parisDay = (d: string | Date) => new Date(d).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", timeZone: "Europe/Paris" });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const CALLABLE = new Set(["a_appeler", "a_rappeler", "r1_pose", "rdv_honore", "proposition"]);
const RDV_STATUTS = new Set(["r1_pose", "rdv_honore", "proposition", "signe"]);

export default async function Dashboard() {
  const [prospects, calls, appts, invoices] = await Promise.all([
    getAllProspects(), getAllCalls(), getAppointments(), getInvoices(),
  ]);
  const map = indexProspects(prospects);
  const now = new Date();
  const todayKey = parisDay(now);

  // --- À faire ---
  const rappelsDue = calls
    .filter((c) => c.rappel_at && parisDay(c.rappel_at) <= todayKey)
    .sort((a, b) => +new Date(a.rappel_at!) - +new Date(b.rappel_at!));
  const relancesCount = new Set(rappelsDue.map((c) => c.prospect_id)).size;

  const toCall = prospects
    .filter((p) => CALLABLE.has(p.statut))
    .sort((a, b) => prospectScore(b) - prospectScore(a))
    .slice(0, 6);

  const upcoming = appts
    .filter((a) => a.status === "reserve" && a.source !== "rappel" && new Date(a.start_at) >= now)
    .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
  const nextRdv = upcoming.slice(0, 5);

  // --- Progression du jour ---
  const callsToday = calls.filter((c) => parisDay(c.created_at) === todayKey).length;
  const chauds = prospects.filter((p) => p.interet === "chaud").length;

  // --- Conversion ---
  const total = prospects.length;
  const contacted = new Set(calls.map((c) => c.prospect_id).filter(Boolean)).size;
  const rdvCount = prospects.filter((p) => RDV_STATUTS.has(p.statut)).length;
  const signes = prospects.filter((p) => p.statut === "signe").length;

  // --- Business (factures) ---
  const fac = invoices.filter((i) => i.doc_type !== "devis");
  const caFacture = fac.filter((i) => i.status !== "annulee").reduce((s, i) => s + (i.total_ttc || 0), 0);
  const caEncaisse = fac.filter((i) => i.status === "payee").reduce((s, i) => s + (i.total_ttc || 0), 0);
  const caAttente = fac.filter((i) => i.status === "envoyee").reduce((s, i) => s + (i.total_ttc || 0), 0);

  // --- Vues d'ensemble ---
  const maxStatut = Math.max(1, ...STATUTS.map((s) => prospects.filter((p) => p.statut === s.key).length));
  const regionCounts = new Map<string, number>();
  for (const p of prospects) {
    const r = regionForDept(p.departement);
    regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1);
  }
  const regions = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxRegion = Math.max(1, ...regions.map((r) => r[1]));

  const kpis = [
    { label: "Appels aujourd'hui", value: callsToday, icon: PhoneCall, color: "#2563eb", href: "/crm/stats" },
    { label: "À relancer", value: relancesCount, icon: AlarmClock, color: relancesCount > 0 ? "#dc2626" : "#64748b", href: "/crm/relances" },
    { label: "RDV à venir", value: upcoming.length, icon: CalendarClock, color: "#059669", href: "/crm/agenda" },
    { label: "Chauds", value: chauds, icon: Flame, color: "#ea580c", href: "/crm/prospects" },
    { label: "Encaissé", value: eur2(caEncaisse), icon: Wallet, color: "#7c3aed", href: "/crm/factures" },
  ];

  const card = "rounded-2xl border border-line bg-white p-5";

  return (
    <div>
      {/* En-tête + actions */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm capitalize text-mut">{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/crm/session" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Headphones size={16} /> Session d'appels
          </Link>
          <Link href="/crm/prospects/nouveau" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent">
            <Plus size={16} /> Nouveau prospect
          </Link>
        </div>
      </div>

      {/* Alerte relances */}
      {relancesCount > 0 && (
        <Link href="/crm/relances" className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 transition-colors hover:bg-red-100">
          <AlarmClock size={20} className="shrink-0 text-red-600" />
          <p className="flex-1 text-sm font-medium text-red-800"><strong>{relancesCount}</strong> relance{relancesCount > 1 ? "s" : ""} à traiter aujourd'hui (rappels échus ou du jour).</p>
          <span className="shrink-0 text-sm font-semibold text-red-700">Traiter →</span>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link key={k.label} href={k.href} className={`${card} transition-shadow hover:shadow-md`}>
              <Icon size={20} style={{ color: k.color }} />
              <p className="mt-3 font-display text-2xl font-bold">{k.value}</p>
              <p className="text-sm text-mut">{k.label}</p>
            </Link>
          );
        })}
      </div>

      {/* À appeler en priorité + Rappels */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className={`${card} lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">À appeler en priorité</h2>
            <Link href="/crm/session" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">Lancer la session <ArrowRight size={14} /></Link>
          </div>
          {toCall.length === 0 ? (
            <p className="text-sm text-mut">Aucun prospect à appeler. 🎉</p>
          ) : (
            <div className="divide-y divide-line">
              {toCall.map((p) => {
                const sc = prospectScore(p);
                const tier = scoreTier(sc);
                const im = interetMeta(p.interet);
                const href = telHref(p.telephone);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 shrink-0 text-center">
                      <span className="rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: tier.color }}>{sc}</span>
                    </span>
                    <OpenFicheLink prospect={p} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-[15px] font-semibold hover:text-accent">{p.nom}</p>
                      <p className="truncate text-[12px] text-mut">{[p.ville, statutLabel(p.statut)].filter(Boolean).join(" · ")}</p>
                    </OpenFicheLink>
                    {im && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: im.color }} title={im.label} />}
                    {href && <a href={href} title="Appeler" className="shrink-0 rounded-md border border-line p-1.5 text-ink hover:border-accent hover:text-accent"><Phone size={14} /></a>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">À relancer</h2>
            <Link href="/crm/relances" className="text-sm text-accent hover:underline">Tout →</Link>
          </div>
          {rappelsDue.length === 0 ? (
            <p className="text-sm text-mut">Aucune relance en attente.</p>
          ) : (
            <ul className="space-y-2">
              {rappelsDue.slice(0, 6).map((c) => {
                const p = map.get(c.prospect_id);
                const overdue = parisDay(c.rappel_at!) < todayKey;
                return (
                  <li key={c.id} className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${overdue ? "bg-red-500" : "bg-amber-500"}`} />
                    {p ? (
                      <OpenFicheLink prospect={p} className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-accent">{p.nom ?? "Prospect"}</OpenFicheLink>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">Prospect</span>
                    )}
                    <span className={`shrink-0 text-[11px] ${overdue ? "text-red-600" : "text-mut"}`}>{fmtDate(c.rappel_at!)}</span>
                    <form action={clearRappel} className="shrink-0">
                      <input type="hidden" name="call_id" value={c.id} />
                      <input type="hidden" name="prospect_id" value={c.prospect_id} />
                      <button title="Traité" className="rounded-md border border-line p-1 text-emerald-600 hover:bg-emerald-50"><Check size={12} /></button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Prochains RDV · Conversion · Facturation */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Prochains RDV</h2>
            <Link href="/crm/agenda" className="text-sm text-accent hover:underline">Agenda →</Link>
          </div>
          {nextRdv.length === 0 ? (
            <p className="text-sm text-mut">Aucun rendez-vous à venir.</p>
          ) : (
            <ul className="space-y-2">
              {nextRdv.map((a) => {
                const p = a.prospect_id ? map.get(a.prospect_id) : null;
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-xs font-bold text-accent">{fmtDate(a.start_at)}</p>
                      <p className="text-xs text-mut">{fmtTime(a.start_at)}</p>
                    </div>
                    {p ? (
                      <OpenFicheLink prospect={p} className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-accent">{a.name || p.nom || "Rendez-vous"}</OpenFicheLink>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{a.name || "Rendez-vous"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Link href="/crm/stats" className={`${card} transition-shadow hover:shadow-md`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Conversion</h2>
            <TrendingUp size={18} className="text-accent" />
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-mut">Prospects</span><b>{total}</b></div>
            <div className="flex items-center justify-between"><span className="text-mut">Contactés</span><b>{contacted} <span className="text-[11px] font-medium text-accent">({pct(contacted, total)}%)</span></b></div>
            <div className="flex items-center justify-between"><span className="text-mut">RDV</span><b>{rdvCount} <span className="text-[11px] font-medium text-accent">({pct(rdvCount, contacted)}%)</span></b></div>
            <div className="flex items-center justify-between"><span className="text-mut">Signés</span><b>{signes} <span className="text-[11px] font-medium text-emerald-600">({pct(signes, rdvCount)}%)</span></b></div>
          </div>
        </Link>

        <Link href="/crm/factures" className={`${card} transition-shadow hover:shadow-md`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Facturation</h2>
            <Wallet size={18} className="text-accent" />
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-mut">Facturé</span><b>{eur2(caFacture)}</b></div>
            <div className="flex items-center justify-between"><span className="text-mut">Encaissé</span><b className="text-emerald-600">{eur2(caEncaisse)}</b></div>
            <div className="flex items-center justify-between"><span className="text-mut">En attente</span><b className="text-accent">{eur2(caAttente)}</b></div>
          </div>
        </Link>
      </div>

      {/* Pipeline + Régions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Pipeline</h2>
            <Link href="/crm/pipeline" className="text-sm text-accent hover:underline">Pipeline →</Link>
          </div>
          <div className="space-y-2.5">
            {STATUTS.map((s) => {
              const n = prospects.filter((p) => p.statut === s.key).length;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-mut">{statutLabel(s.key)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(n / maxStatut) * 100}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <h2 className="mb-4 font-display text-lg font-bold">Par région</h2>
          <div className="space-y-2.5">
            {regions.map(([r, n]) => (
              <div key={r} className="flex items-center gap-3">
                <span className="w-48 shrink-0 truncate text-sm text-mut">{r}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(n / maxRegion) * 100}%` }} />
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
