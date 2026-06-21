"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Phone, RotateCcw, ExternalLink } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { updateAppointmentStatus } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";
import type { AgendaItem } from "./AgendaView";

const PARIS = "Europe/Paris";
const PX = 52; // hauteur d'une heure (px)
const DEFAULT_DUR = 30; // durée par défaut (min)

function parisParts(d: Date): { key: string; min: number } {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: PARIS, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(d)) p[part.type] = part.value;
  const h = p.hour === "24" ? 0 : +p.hour;
  return { key: `${p.year}-${p.month}-${p.day}`, min: h * 60 + +p.minute };
}
function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function weekday(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function labelDay(key: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(key + "T12:00:00Z").toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type Placed = { item: AgendaItem; startMin: number; endMin: number; lane: number; lanes: number };

function layoutDay(items: AgendaItem[]): Placed[] {
  const evs = items
    .map((item) => {
      const s = parisParts(new Date(item.start)).min;
      let e = item.end ? parisParts(new Date(item.end)).min : s + DEFAULT_DUR;
      if (e <= s) e = s + DEFAULT_DUR;
      return { item, startMin: s, endMin: e };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const out: Placed[] = [];
  let cluster: typeof evs = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const laneEnds: number[] = [];
    const withLane = cluster.map((ev) => {
      let lane = laneEnds.findIndex((end) => end <= ev.startMin);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(ev.endMin); }
      else laneEnds[lane] = ev.endMin;
      return { ...ev, lane };
    });
    const lanes = laneEnds.length;
    for (const ev of withLane) out.push({ ...ev, lanes });
    cluster = [];
    clusterEnd = -1;
  };
  for (const ev of evs) {
    if (cluster.length && ev.startMin < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, ev.endMin);
    } else {
      flush();
      cluster = [ev];
      clusterEnd = ev.endMin;
    }
  }
  flush();
  return out;
}

const STYLE = {
  rdv: { bg: "#EAF1FF", bar: "#2563EB", tx: "#1E3A8A" },
  rappel: { bg: "#FEF3E2", bar: "#D97706", tx: "#92600A" },
  done: { bg: "#F1F5F9", bar: "#94A3B8", tx: "#64748B" },
};

export default function WeekCalendar({
  items,
  nowISO,
  days,
}: {
  items: AgendaItem[];
  nowISO: string;
  days: 7 | 1;
}) {
  const { open } = useFiche();
  const now = useMemo(() => new Date(nowISO), [nowISO]);
  const nowParts = useMemo(() => parisParts(now), [now]);
  const todayKey = nowParts.key;

  const [cursor, setCursor] = useState(todayKey);
  const [pop, setPop] = useState<{ item: AgendaItem; x: number; y: number } | null>(null);

  const cols = useMemo(() => {
    if (days === 1) return [cursor];
    const monday = addDays(cursor, -((weekday(cursor) + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [cursor, days]);

  const [hourStart, hourEnd] = useMemo(() => {
    let lo = 8, hi = 20;
    for (const it of items) {
      const s = parisParts(new Date(it.start)).min / 60;
      const e = (it.end ? parisParts(new Date(it.end)).min : parisParts(new Date(it.start)).min + DEFAULT_DUR) / 60;
      lo = Math.min(lo, Math.floor(s));
      hi = Math.max(hi, Math.ceil(e));
    }
    return [Math.max(0, Math.min(lo, 8)), Math.min(24, Math.max(hi, 20))];
  }, [items]);

  const hours = Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i);
  const totalH = (hourEnd - hourStart) * PX;

  const byDay = useMemo(() => {
    const m = new Map<string, AgendaItem[]>();
    for (const it of items) {
      const k = parisParts(new Date(it.start)).key;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(it);
    }
    return m;
  }, [items]);

  const move = (n: number) => setCursor((c) => addDays(c, n * days));
  const rangeLabel =
    days === 1
      ? labelDay(cursor, { weekday: "long", day: "numeric", month: "long" })
      : `${labelDay(cols[0], { day: "numeric", month: "short" })} – ${labelDay(cols[6], { day: "numeric", month: "short", year: "numeric" })}`;

  const template = `56px repeat(${cols.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <h2 className="font-display text-lg font-bold capitalize text-ink">{rangeLabel}</h2>
        <div className="flex items-center gap-1.5">
          <button onClick={() => move(-1)} className="rounded-lg border border-line p-1.5 text-mut hover:bg-paper hover:text-ink" aria-label="Précédent">
            <ChevronLeft size={17} />
          </button>
          <button onClick={() => setCursor(todayKey)} className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-paper">
            Aujourd'hui
          </button>
          <button onClick={() => move(1)} className="rounded-lg border border-line p-1.5 text-mut hover:bg-paper hover:text-ink" aria-label="Suivant">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="max-h-[68vh] overflow-y-auto">
        {/* En-têtes de jours (collés en haut au scroll) */}
        <div
          className="sticky top-0 z-30 grid border-y border-line bg-white/95 backdrop-blur"
          style={{ gridTemplateColumns: template }}
        >
          <div />
          {cols.map((key) => {
            const isToday = key === todayKey;
            const wd = weekday(key);
            const weekend = wd === 0 || wd === 6;
            return (
              <div key={key} className={`px-1 py-2.5 text-center ${weekend ? "bg-paper/60" : ""}`}>
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? "text-accent" : "text-mut"}`}>
                  {labelDay(key, { weekday: "short" }).replace(".", "")}
                </div>
                <div
                  className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full font-display text-[15px] font-bold ${
                    isToday ? "bg-accent text-white" : "text-ink"
                  }`}
                >
                  {labelDay(key, { day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille horaire */}
        <div className="relative grid" style={{ gridTemplateColumns: template, height: totalH }}>
          {/* Gouttière des heures */}
          <div className="relative">
            {hours.map((h, i) =>
              i === 0 ? null : (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-mut" style={{ top: (h - hourStart) * PX }}>
                  {h}h
                </span>
              )
            )}
          </div>

          {/* Colonnes des jours */}
          {cols.map((key) => {
            const placed = layoutDay(byDay.get(key) ?? []);
            const isToday = key === todayKey;
            const wd = weekday(key);
            const weekend = wd === 0 || wd === 6;
            const nowTop = ((nowParts.min - hourStart * 60) / 60) * PX;
            const showNow = isToday && nowParts.min >= hourStart * 60 && nowParts.min <= hourEnd * 60;
            return (
              <div key={key} className={`relative border-l border-line ${weekend ? "bg-paper/40" : ""} ${isToday ? "bg-accent/[0.03]" : ""}`}>
                {/* lignes d'heures (fines et claires) */}
                {hours.map((h, i) =>
                  i === 0 ? null : (
                    <div
                      key={h}
                      className="absolute inset-x-0"
                      style={{ top: (h - hourStart) * PX, borderTop: "1px solid rgba(10,10,10,0.06)" }}
                    />
                  )
                )}

                {placed.map((pl) => (
                  <EventBlock
                    key={pl.item.id}
                    pl={pl}
                    hourStart={hourStart}
                    now={now}
                    onClick={(e) => setPop({ item: pl.item, x: e.clientX, y: e.clientY })}
                  />
                ))}

                {showNow && (
                  <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                    <div className="relative border-t-2 border-red-500">
                      <span className="absolute -left-[3px] -top-[5px] h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-line px-4 py-2.5 text-xs text-mut">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STYLE.rdv.bar }} /> Rendez-vous</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STYLE.rappel.bar }} /> Rappel</span>
      </div>

      {pop && (
        <Popover
          pop={pop}
          onClose={() => setPop(null)}
          onOpenFiche={() => {
            if (pop.item.prospect) open(pop.item.prospect.id, pop.item.prospect);
            setPop(null);
          }}
        />
      )}
    </div>
  );
}

function EventBlock({
  pl,
  hourStart,
  now,
  onClick,
}: {
  pl: Placed;
  hourStart: number;
  now: Date;
  onClick: (e: React.MouseEvent) => void;
}) {
  const top = ((pl.startMin - hourStart * 60) / 60) * PX;
  const height = Math.max(((pl.endMin - pl.startMin) / 60) * PX - 3, 22);
  const width = `calc(${100 / pl.lanes}% - 5px)`;
  const left = `calc(${(100 / pl.lanes) * pl.lane}% + 3px)`;
  const done = pl.item.status === "honore";
  const overdue = pl.item.status === "reserve" && new Date(pl.item.start) < now;
  const s = done ? STYLE.done : pl.item.type === "rdv" ? STYLE.rdv : STYLE.rappel;
  const tall = height > 34;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute flex flex-col overflow-hidden rounded-md pl-2 pr-1.5 py-1 text-left transition-all hover:z-10 hover:shadow-md"
      style={{
        top,
        height,
        left,
        width,
        background: s.bg,
        borderLeft: `3px solid ${overdue ? "#EF4444" : s.bar}`,
      }}
    >
      <span
        className="truncate text-[11.5px] font-bold leading-tight"
        style={{ color: s.tx, textDecoration: done ? "line-through" : undefined }}
      >
        {pl.item.type === "rappel" ? "Rappel — " : ""}{pl.item.title}
      </span>
      {tall && (
        <span className="truncate text-[10.5px] font-medium leading-tight" style={{ color: s.tx, opacity: 0.75 }}>
          {hhmm(pl.startMin)}
        </span>
      )}
    </button>
  );
}

function Popover({
  pop,
  onClose,
  onOpenFiche,
}: {
  pop: { item: AgendaItem; x: number; y: number };
  onClose: () => void;
  onOpenFiche: () => void;
}) {
  const { item } = pop;
  const W = 264;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.max(12, Math.min(pop.x - W / 2, vw - W - 12));
  const top = Math.min(pop.y + 8, vh - 230);
  const done = item.status === "honore";
  const start = new Date(item.start);
  const bar = item.type === "rdv" ? STYLE.rdv.bar : STYLE.rappel.bar;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 overflow-hidden rounded-2xl border border-line bg-white shadow-2xl" style={{ left, top, width: W }}>
        <div className="h-1.5" style={{ background: bar }} />
        <div className="p-4">
          <p className="font-display text-base font-bold leading-tight text-ink">
            {item.type === "rappel" ? "Rappel — " : ""}{item.title}
          </p>
          <p className="mt-1 text-[13px] capitalize text-mut">
            {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: PARIS })}
            {" · "}
            {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS })}
          </p>
          {item.phone && (
            <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
              <Phone size={13} /> {item.phone}
            </a>
          )}

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {item.prospect && (
              <button onClick={onOpenFiche} className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-accent">
                <ExternalLink size={13} /> Fiche
              </button>
            )}
            {done ? (
              <form action={updateAppointmentStatus}>
                <input type="hidden" name="id" value={item.id} />
                <button name="status" value="reserve" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-mut hover:bg-paper">
                  <RotateCcw size={13} /> Rétablir
                </button>
              </form>
            ) : (
              <>
                <form action={updateAppointmentStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <button name="status" value="honore" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-700 hover:bg-emerald-100">
                    <Check size={13} /> Fait
                  </button>
                </form>
                <form action={updateAppointmentStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <button name="status" value="annule" className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12.5px] font-semibold text-red-600 hover:bg-red-100">
                    <X size={13} /> Annuler
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
