import { TrendingUp, CalendarCheck } from "lucide-react";

/**
 * Écran « analyse de campagne Meta » en direct : KPIs, courbe de rendez-vous
 * générés (barres animées) et flux de notifications « Nouveau RDV » qui tombent.
 * 100 % CSS transform/opacity (neutralisé en prefers-reduced-motion).
 * Représentation stylisée — pas une capture de compte réel.
 */

const BARS = [34, 48, 40, 62, 55, 80, 72]; // hauteurs %
const RDV = [
  { motif: "Bilan auditif", ville: "La Rochelle" },
  { motif: "Examen de vue", ville: "Hérault" },
  { motif: "Essai d'aides auditives", ville: "Bordeaux" },
];

export default function MetaAdsLive() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white shadow-float">
      {/* En-tête */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1877F2] text-[12px] font-bold text-white">
          f
        </span>
        <span className="text-[13px] font-bold text-ink/80">Campagne Meta</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          en direct
        </span>
      </div>

      <div className="space-y-4 p-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: "12,4k", l: "diffusion" },
            { v: "318", l: "clics" },
            { v: "14 €", l: "coût / RDV" },
          ].map((k) => (
            <div key={k.l} className="rounded-xl border border-line bg-paper p-3">
              <div className="font-display text-lg font-bold text-ink">{k.v}</div>
              <div className="text-[11px] text-mut">{k.l}</div>
            </div>
          ))}
        </div>

        {/* Graphe — rendez-vous / jour */}
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12px] font-bold text-ink/70">Rendez-vous générés / jour</span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp size={13} /> +32 %
            </span>
          </div>
          <div className="flex h-28 items-end gap-2">
            {BARS.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-full w-full items-end">
                  <div
                    className={`anim-bar w-full rounded-md ${i === 5 ? "bg-accent" : "bg-accent/25"}`}
                    style={{ height: `${h}%`, animationDelay: `${i * 0.09}s` }}
                  />
                </div>
                <span className="text-[9px] text-mut">{["L", "M", "M", "J", "V", "S", "D"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flux RDV en direct */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mut">
            Rendez-vous entrants
          </p>
          <div className="relative h-[60px]">
            {RDV.map((r, i) => (
              <div
                key={i}
                className="anim-rdvpop absolute inset-x-0 top-0 flex items-center gap-3 rounded-xl border border-line bg-white p-2.5 shadow-card"
                style={{ animationDelay: `${i * 3}s` }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-600">
                  <CalendarCheck size={16} />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-ink">Nouveau rendez-vous</p>
                  <p className="text-[11px] text-mut">
                    {r.motif} · {r.ville}
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  +1
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
