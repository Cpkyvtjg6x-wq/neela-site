"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, X, Phone, RotateCcw, ExternalLink } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { updateAppointmentStatus } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";
import type { AgendaItem } from "./AgendaView";

const PARIS = "Europe/Paris";
const PX = 56; // hauteur d'une heure en pixels
const DEFAULT_DUR = 30; // durée par défaut (min) si pas de fin

// Décompose une date en (clé de jour Paris, minutes depuis minuit Paris).
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

// Arithmétique sur des clés "YYYY-MM-DD" (via UTC midi, robuste au changement d'heure).
function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}
function weekday(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
}
function labelDay(key: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(key + "T12:00:00Z").toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}
const hhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

type Placed = { item: AgendaItem; startMin: number; endMin: number; lane: number; lanes: number };

// Place les évènements d'un jour en colonnes (lanes) pour gérer les chevauchements.
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

  // Colonnes affichées.
  const cols = useMemo(() => {
    if (days === 1) return [cursor];
    const monday = addDays(cursor, -((weekday(cursor) + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [cursor, days]);

  // Plage horaire : 8h–20h par défaut, élargie si des évènements débordent.
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

  return (
    <div>
      {/* Barre d'outils */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold capitalize">{rangeLabel}</h2>
        <div className="flex gap-1">
          <button onClick={() => move(-1)} className="rounded-lg border border-line p-1.5 hover:bg-paper" aria-label="Précédent">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCursor(todayKey)} className="rounded-lg border border-line px-2.5 text-xs font-medium hover:bg-paper">
            Auj.
          </button>
          <button onClick={() => move(1)} className="rounded-lg border border-line p-1.5 hover:bg-paper" aria-label="Suivant">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <div className={days === 7 ? "min-w-[720px]" : "min-w-[320px]"}>
          {/* En-têtes de jours */}
          <div className="flex border-b border-line">
            <div className="w-14 shrink-0" />
            {cols.map((key) => {
              const isToday = key === todayKey;
              return (
                <div key={key} className={`flex-1 px-2 py-2 text-center ${isToday ? "bg-accent/5" : ""}`}>
                  <p className="text-[11px] uppercase text-mut">{labelDay(key, { weekday: "short" })}</p>
                  <p className={`font-display text-lg font-bold ${isToday ? "text-accent" : "text-ink"}`}>
                    {labelDay(key, { day: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Grille horaire */}
          <div className="relative" style={{ height: totalH }}>
            {/* Lignes + libellés d'heures */}
            {hours.map((h) => (
              <div key={h} className="absolute left-0 right-0 border-t border-line/60" style={{ top: (h - hourStart) * PX }}>
                <span className="absolute -top-2 left-2 text-[11px] text-mut">{h}:00</span>
              </div>
            ))}

            {/* Colonnes des jours */}
            <div className="absolute inset-0 flex pl-14">
              {cols.map((key) => {
                const placed = layoutDay(byDay.get(key) ?? []);
                const isToday = key === todayKey;
                const nowTop = (nowParts.min - hourStart * 60) / 60 * PX;
                const showNow = isToday && nowParts.min >= hourStart * 60 && nowParts.min <= hourEnd * 60;
                return (
                  <div key={key} className={`relative flex-1 border-l border-line ${isToday ? "bg-accent/5" : ""}`}>
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
                      <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: nowTop }}>
                        <div className="relative">
                          <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-600" />
                          <div className="border-t-2 border-red-600" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-mut">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Rendez-vous</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Rappel</span>
      </div>

      {/* Popover de détail */}
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
  const top = (pl.startMin - hourStart * 60) / 60 * PX;
  const height = Math.max(((pl.endMin - pl.startMin) / 60) * PX - 2, 20);
  const width = `calc(${100 / pl.lanes}% - 4px)`;
  const left = `calc(${(100 / pl.lanes) * pl.lane}% + 2px)`;
  const done = pl.item.status === "honore";
  const overdue = pl.item.status === "reserve" && new Date(pl.item.start) < now;
  const rdv = pl.item.type === "rdv";

  const bg = done ? "#f1f5f9" : rdv ? "#e8f6ee" : "#fef3e2";
  const bar = done ? "#94a3b8" : rdv ? "#059669" : "#d97706";
  const tx = done ? "#64748b" : rdv ? "#065f46" : "#92600a";

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left transition-shadow hover:shadow-md"
      style={{
        top,
        height,
        left,
        width,
        background: bg,
        borderLeftColor: bar,
        boxShadow: overdue ? "0 0 0 1.5px #ef4444 inset" : undefined,
      }}
    >
      <p className="truncate text-[11.5px] font-bold leading-tight" style={{ color: tx, textDecoration: done ? "line-through" : undefined }}>
        {pl.item.type === "rappel" ? "Rappel — " : ""}{pl.item.title}
      </p>
      {height > 30 && (
        <p className="truncate text-[10.5px] leading-tight" style={{ color: tx, opacity: 0.8 }}>
          {hhmm(pl.startMin)}
        </p>
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
  const W = 256;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.min(pop.x, vw - W - 12);
  const top = Math.min(pop.y, vh - 220);
  const done = item.status === "honore";
  const start = new Date(item.start);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-2xl border border-line bg-white p-4 shadow-2xl"
        style={{ left, top, width: W }}
      >
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: item.type === "rdv" ? "#059669" : "#d97706" }}
        >
          {item.type === "rdv" ? "Rendez-vous" : "Rappel"}
        </span>
        <p className="mt-2 font-display text-base font-bold leading-tight">{item.title}</p>
        <p className="mt-1 text-[13px] text-mut">
          {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: PARIS })}
          {" · "}
          {start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS })}
        </p>
        {item.phone && (
          <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
            <Phone size={13} /> {item.phone}
          </a>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.prospect && (
            <button
              onClick={onOpenFiche}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-paper hover:bg-accent"
            >
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
    </>
  );
}
