/**
 * Maquette « vivante » du CRM Neela : fenêtre app qui passe en boucle par 3 écrans
 * (Pipeline → Agenda → Dashboard) via CSS transform-only (neutralisé en
 * prefers-reduced-motion). Visuel attitré de l'offre « CRM complet ».
 * On n'expose JAMAIS l'app réelle /crm : ceci est une représentation stylisée.
 */

function Bar({ h, accent = false }: { h: number; accent?: boolean }) {
  return (
    <div
      className={`w-3 rounded-sm ${accent ? "bg-accent" : "bg-accent/25"}`}
      style={{ height: `${h}px` }}
    />
  );
}

function MiniCard({ w = "w-full", dot }: { w?: string; dot?: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-1.5 shadow-sm">
      <div className="flex items-center gap-1">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        <span className={`h-1.5 ${w} rounded bg-ink/30`} />
      </div>
      <span className="mt-1 block h-1.5 w-3/5 rounded bg-ink/10" />
    </div>
  );
}

function ScreenPipeline() {
  const cols = [
    { t: "Nouveau", dot: "bg-accent" },
    { t: "RDV pris", dot: "bg-amber-400" },
    { t: "Client", dot: "bg-emerald-500" },
  ];
  return (
    <div className="grid h-[300px] grid-cols-3 gap-2 p-3">
      {cols.map((c) => (
        <div key={c.t} className="rounded-lg bg-paper p-2">
          <div className="mb-2 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
            <span className="text-[10px] font-bold text-ink/70">{c.t}</span>
          </div>
          <div className="space-y-1.5">
            <MiniCard dot={c.dot} />
            <MiniCard w="w-2/3" dot={c.dot} />
            {c.t === "Nouveau" && <MiniCard w="w-3/4" dot={c.dot} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenAgenda() {
  const days = ["L", "M", "M", "J", "V"];
  return (
    <div className="h-[300px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-ink/70">Agenda · cette semaine</span>
        <span className="flex items-center gap-1 text-[9px] text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 12 RDV
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-semibold text-mut">
            {d}
          </div>
        ))}
        {/* créneaux */}
        {Array.from({ length: 20 }).map((_, i) => {
          const filled = [1, 4, 6, 9, 12, 13, 17].includes(i);
          const hot = [6, 12].includes(i);
          return (
            <div
              key={i}
              className={`h-9 rounded-md border ${
                filled
                  ? hot
                    ? "border-accent/30 bg-accent/80"
                    : "border-accent/20 bg-accent/15"
                  : "border-line bg-paper"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScreenDashboard() {
  return (
    <div className="h-[300px] p-3">
      <div className="mb-2 text-[10px] font-bold text-ink/70">Résultats · ce mois</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: "+23", l: "RDV" },
          { n: "14 €", l: "/ RDV" },
          { n: "92 %", l: "présence" },
        ].map((s) => (
          <div key={s.l} className="rounded-lg border border-line bg-white p-2">
            <div className="font-display text-base font-bold text-accent">{s.n}</div>
            <div className="text-[9px] text-mut">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-line bg-white p-3">
        <div className="mb-2 h-1.5 w-1/3 rounded bg-ink/20" />
        <div className="flex h-20 items-end gap-2">
          {[18, 30, 26, 44, 38, 58, 50].map((h, i) => (
            <Bar key={i} h={h} accent={i === 5} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CrmMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      {/* Barre de l'app */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-accent to-ink text-[10px] font-bold text-white">
          N
        </span>
        <span className="text-[11px] font-bold text-ink/80">CRM · Neela</span>
        <span className="ml-auto flex items-center gap-1 text-[9px] text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>
      {/* Fenêtre : cycle entre 3 écrans */}
      <div className="relative h-[300px] overflow-hidden">
        <div className="anim-screencycle absolute inset-x-0 top-0">
          <ScreenPipeline />
          <ScreenAgenda />
          <ScreenDashboard />
        </div>
      </div>
    </div>
  );
}
