"use client";

import { useMemo, useState } from "react";
import { Check, X, Phone, RotateCcw, CalendarClock, AlertTriangle } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { updateAppointmentStatus } from "@/app/crm/actions";
import { useFiche } from "./FicheModal";

export type AgendaItem = {
  id: string;
  start: string; // ISO
  title: string;
  type: "rdv" | "rappel";
  status: string; // "reserve" | "honore" | ...
  prospect: Prospect | null;
  phone: string | null;
};

const PARIS = "Europe/Paris";
const dayKey = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: PARIS }); // YYYY-MM-DD
const dayLabelFull = (d: Date) =>
  d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: PARIS });
const timeLabel = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: PARIS });

export default function AgendaView({ items, nowISO }: { items: AgendaItem[]; nowISO: string }) {
  const { open } = useFiche();
  const now = useMemo(() => new Date(nowISO), [nowISO]);
  const [typeF, setTypeF] = useState<"" | "rdv" | "rappel">("");
  const [hideDone, setHideDone] = useState(false);

  const todayK = dayKey(now);
  const tomorrowK = dayKey(new Date(now.getTime() + 86_400_000));
  const weekLimit = now.getTime() + 7 * 86_400_000;

  const filtered = useMemo(
    () =>
      items.filter((i) => {
        if (typeF && i.type !== typeF) return false;
        if (hideDone && i.status !== "reserve") return false;
        return true;
      }),
    [items, typeF, hideDone]
  );

  const asc = (a: AgendaItem, b: AgendaItem) => +new Date(a.start) - +new Date(b.start);

  // En retard : à traiter (réservé) et déjà passé.
  const overdue = useMemo(
    () => filtered.filter((i) => i.status === "reserve" && new Date(i.start) < now).sort(asc),
    [filtered, now]
  );
  const overdueIds = useMemo(() => new Set(overdue.map((i) => i.id)), [overdue]);

  const groups = useMemo(() => {
    const upcoming = filtered.filter((i) => !overdueIds.has(i.id)).sort(asc);
    const m = new Map<string, AgendaItem[]>();
    for (const i of upcoming) {
      const k = dayKey(new Date(i.start));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(i);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, overdueIds]);

  // Compteurs de résumé (sur tous les items réservés, indépendamment des filtres).
  const counts = useMemo(() => {
    const reserve = items.filter((i) => i.status === "reserve");
    return {
      today: reserve.filter((i) => dayKey(new Date(i.start)) === todayK && new Date(i.start) >= now).length,
      week: reserve.filter((i) => {
        const t = +new Date(i.start);
        return t >= now.getTime() && t <= weekLimit;
      }).length,
      overdue: reserve.filter((i) => new Date(i.start) < now).length,
    };
  }, [items, todayK, now, weekLimit]);

  const dayHeading = (key: string) => {
    if (key === todayK) return "Aujourd'hui";
    if (key === tomorrowK) return "Demain";
    // key = "YYYY-MM-DD" → on reconstruit une date à midi pour un libellé stable.
    return dayLabelFull(new Date(key + "T12:00:00"));
  };

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
      active ? "bg-ink text-paper" : "border border-line text-mut hover:border-ink hover:text-ink"
    }`;

  return (
    <div>
      {/* Résumé */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="font-display text-2xl font-bold">{counts.today}</p>
          <p className="text-xs text-mut">Aujourd'hui</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="font-display text-2xl font-bold">{counts.week}</p>
          <p className="text-xs text-mut">7 prochains jours</p>
        </div>
        <div className={`rounded-2xl border p-4 ${counts.overdue ? "border-red-200 bg-red-50" : "border-line bg-white"}`}>
          <p className={`font-display text-2xl font-bold ${counts.overdue ? "text-red-600" : ""}`}>{counts.overdue}</p>
          <p className={`text-xs ${counts.overdue ? "text-red-700" : "text-mut"}`}>En retard</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button onClick={() => setTypeF("")} className={chip(typeF === "")}>Tout</button>
        <button onClick={() => setTypeF("rdv")} className={chip(typeF === "rdv")}>RDV</button>
        <button onClick={() => setTypeF("rappel")} className={chip(typeF === "rappel")}>Rappels</button>
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-[13px] text-mut">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-accent"
          />
          Masquer les terminés
        </label>
      </div>

      {/* En retard */}
      {overdue.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-600">
            <AlertTriangle size={14} /> En retard ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((i) => (
              <Row key={i.id} item={i} overdue onOpen={open} />
            ))}
          </div>
        </div>
      )}

      {/* Jours à venir */}
      {groups.length === 0 && overdue.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-sm text-mut">
          Rien de prévu. Ajoute un rendez-vous ci-dessous.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, dayItems]) => (
            <div key={key}>
              <h2 className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-mut">
                <span className={key === todayK ? "text-accent" : ""}>{dayHeading(key)}</span>
                <span className="font-medium normal-case text-mut">{dayItems.length}</span>
              </h2>
              <div className="space-y-2">
                {dayItems.map((i) => (
                  <Row key={i.id} item={i} onOpen={open} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-mut">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Rendez-vous</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Rappel</span>
      </div>
    </div>
  );
}

function Row({
  item,
  overdue = false,
  onOpen,
}: {
  item: AgendaItem;
  overdue?: boolean;
  onOpen: (id: string, seed?: Prospect | null) => void;
}) {
  const d = new Date(item.start);
  const done = item.status === "honore";
  const dot = item.type === "rdv" ? "bg-emerald-500" : "bg-amber-500";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 ${
        overdue ? "border-red-200" : "border-line"
      } ${done ? "opacity-60" : ""}`}
    >
      {/* Heure */}
      <div className="w-12 shrink-0 text-center">
        <p className={`font-display text-sm font-bold ${overdue ? "text-red-600" : "text-ink"}`}>{timeLabel(d)}</p>
      </div>

      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />

      {/* Titre + tel */}
      <div className="min-w-0 flex-1">
        {item.prospect ? (
          <button
            type="button"
            onClick={() => onOpen(item.prospect!.id, item.prospect)}
            className={`block max-w-full truncate text-left text-sm font-semibold hover:text-accent ${
              done ? "line-through" : ""
            }`}
          >
            {item.type === "rappel" ? "Rappel — " : ""}
            {item.title}
          </button>
        ) : (
          <span className={`block truncate text-sm font-semibold ${done ? "line-through" : ""}`}>
            {item.type === "rappel" ? "Rappel — " : ""}
            {item.title}
          </span>
        )}
        {item.phone && (
          <a
            href={`tel:${item.phone.replace(/\s/g, "")}`}
            className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-mut hover:text-accent"
          >
            <Phone size={11} /> {item.phone}
          </a>
        )}
      </div>

      {/* Actions */}
      {done ? (
        <form action={updateAppointmentStatus} className="shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <span className="mr-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Fait</span>
          <button
            name="status"
            value="reserve"
            title="Rétablir (à refaire)"
            className="rounded-md border border-line p-1 text-mut hover:bg-paper"
          >
            <RotateCcw size={13} />
          </button>
        </form>
      ) : (
        <form action={updateAppointmentStatus} className="flex shrink-0 gap-1">
          <input type="hidden" name="id" value={item.id} />
          <button
            name="status"
            value="honore"
            title="Marquer comme fait"
            className="rounded-md border border-line p-1.5 text-emerald-600 hover:bg-emerald-50"
          >
            <Check size={14} />
          </button>
          <button
            name="status"
            value="annule"
            title="Annuler"
            className="rounded-md border border-line p-1.5 text-red-600 hover:bg-red-50"
          >
            <X size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
