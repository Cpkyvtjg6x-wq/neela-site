import { Phone, CalendarDays, MessageSquare, FileText, TrendingUp } from "lucide-react";

/**
 * Showcase CRM « complet » : une fenêtre d'application dans laquelle on PEUT
 * défiler (overflow-y-auto) à travers tous les modules — cockpit, KPIs, pipeline,
 * agenda, relances SMS, factures. Représentation stylisée (jamais l'app réelle /crm).
 * Quelques éléments « vivants » (pulsation live, barres) en CSS, neutralisés en
 * prefers-reduced-motion.
 */

function Stat({ n, l, up }: { n: string; l: string; up?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex items-center gap-1.5">
        <span className="font-display text-lg font-bold text-ink">{n}</span>
        {up && <TrendingUp size={13} className="text-emerald-500" />}
      </div>
      <div className="mt-0.5 text-[11px] text-mut">{l}</div>
    </div>
  );
}

function Row({ name, tag, tagColor }: { name: string; tag: string; tagColor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
        {name.charAt(0)}
      </span>
      <span className="text-[12px] font-semibold text-ink/80">{name}</span>
      <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagColor}`}>
        {tag}
      </span>
    </div>
  );
}

function Module({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Phone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon size={15} />
        </span>
        <h4 className="text-[13px] font-bold text-ink">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function CrmShowcase() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-float">
      {/* Barre d'app */}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-ink text-[11px] font-bold text-white">
          N
        </span>
        <span className="text-[13px] font-bold text-ink/80">CRM · Neela</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>

      {/* Corps SCROLLABLE — on défile dans le CRM */}
      <div className="h-[460px] space-y-4 overflow-y-auto bg-[#f6f8fb] p-4 [scrollbar-width:thin]">
        {/* Cockpit */}
        <div className="rounded-2xl border border-line bg-gradient-to-br from-accent to-ink p-4 text-white">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">Cockpit du jour</p>
          <p className="mt-1 font-display text-lg font-bold">Bonjour 👋 — 6 priorités</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/10 py-2">
              <div className="font-display text-base font-bold">8</div>
              <div className="text-[9px] text-white/70">à appeler</div>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <div className="font-display text-base font-bold">12</div>
              <div className="text-[9px] text-white/70">RDV semaine</div>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <div className="font-display text-base font-bold">3</div>
              <div className="text-[9px] text-white/70">relances</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Stat n="+23" l="RDV ce mois" up />
          <Stat n="14 €" l="coût / RDV" />
          <Stat n="92 %" l="présence" up />
        </div>

        {/* À appeler */}
        <Module icon={Phone} title="À appeler en priorité">
          <div className="space-y-2">
            <Row name="Centre Audition Prado" tag="Rappel aujourd'hui" tagColor="bg-amber-100 text-amber-700" />
            <Row name="Optique La Flotte" tag="Devis envoyé" tagColor="bg-accent/10 text-accent" />
            <Row name="Cabinet Vision+" tag="Nouveau" tagColor="bg-emerald-100 text-emerald-700" />
          </div>
        </Module>

        {/* Pipeline */}
        <Module icon={TrendingUp} title="Pipeline">
          <div className="grid grid-cols-3 gap-2">
            {[
              { t: "Nouveau", dot: "bg-accent", c: 3 },
              { t: "RDV pris", dot: "bg-amber-400", c: 2 },
              { t: "Client", dot: "bg-emerald-500", c: 4 },
            ].map((col) => (
              <div key={col.t} className="rounded-lg bg-white p-2">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-[10px] font-bold text-ink/70">{col.t}</span>
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: col.c }).map((_, i) => (
                    <div key={i} className="rounded-md border border-line bg-paper p-1.5">
                      <span className="block h-1.5 w-full rounded bg-ink/20" />
                      <span className="mt-1 block h-1.5 w-3/5 rounded bg-ink/10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Module>

        {/* Agenda */}
        <Module icon={CalendarDays} title="Agenda · cette semaine">
          <div className="grid grid-cols-5 gap-1.5">
            {["L", "M", "M", "J", "V"].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-semibold text-mut">{d}</div>
            ))}
            {Array.from({ length: 20 }).map((_, i) => {
              const filled = [1, 4, 6, 9, 12, 13, 17].includes(i);
              const hot = [6, 12].includes(i);
              return (
                <div
                  key={i}
                  className={`h-8 rounded-md border ${
                    filled
                      ? hot
                        ? "border-accent/30 bg-accent/80"
                        : "border-accent/20 bg-accent/15"
                      : "border-line bg-white"
                  }`}
                />
              );
            })}
          </div>
        </Module>

        {/* Relances SMS */}
        <Module icon={MessageSquare} title="Relances SMS">
          <div className="space-y-2">
            <div className="rounded-lg border border-line bg-white p-2.5 text-[11px] text-ink/70">
              « Bonjour, votre bilan auditif est confirmé jeudi à 14&nbsp;h&nbsp;30. À très vite ! »
              <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                envoyé
              </span>
            </div>
            <div className="rounded-lg border border-line bg-white p-2.5 text-[11px] text-mut">
              « Un petit rappel pour votre rendez-vous de demain… »
              <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                programmé
              </span>
            </div>
          </div>
        </Module>

        {/* Factures */}
        <Module icon={FileText} title="Factures">
          <div className="overflow-hidden rounded-lg border border-line">
            {[
              { id: "F-2026-014", c: "Onécoute Prado", s: "Payée", sc: "text-emerald-600" },
              { id: "F-2026-015", c: "Optique La Flotte", s: "Envoyée", sc: "text-accent" },
              { id: "F-2026-016", c: "Vision+", s: "Brouillon", sc: "text-mut" },
            ].map((f, i) => (
              <div
                key={f.id}
                className={`flex items-center gap-3 px-3 py-2 text-[11px] ${i > 0 ? "border-t border-line" : ""} bg-white`}
              >
                <span className="font-mono text-[10px] text-mut">{f.id}</span>
                <span className="font-semibold text-ink/80">{f.c}</span>
                <span className={`ml-auto font-semibold ${f.sc}`}>{f.s}</span>
              </div>
            ))}
          </div>
        </Module>

        <p className="pb-1 text-center text-[10px] text-mut">↑ tout le cabinet, piloté au même endroit</p>
      </div>
    </div>
  );
}
