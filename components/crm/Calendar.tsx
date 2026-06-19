"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { updateAppointmentStatus } from "@/app/crm/actions";

export type CalEvent = {
  id: string;
  date: string; // ISO
  title: string;
  type: "rdv" | "rappel";
  href?: string;
};

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function Calendar({ events }: { events: CalEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => new Date().toDateString());

  // Évite tout décalage d'hydratation (les dates dépendent du fuseau du client).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = new Date(e.date).toDateString();
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    return m;
  }, [events]);

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="h-80 rounded-2xl border border-line bg-white" />
        <div className="h-80 rounded-2xl border border-line bg-white" />
      </div>
    );
  }

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
  const todayStr = new Date().toDateString();

  const cells: (number | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = (byDay.get(selected) ?? []).sort(
    (a, b) => +new Date(a.date) - +new Date(b.date)
  );

  const move = (delta: number) =>
    setCursor(new Date(year, month + delta, 1));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">
            {MOIS[month]} {year}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => move(-1)}
              className="rounded-lg border border-line p-1.5 hover:bg-paper"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="rounded-lg border border-line px-2.5 text-xs font-medium hover:bg-paper"
            >
              Auj.
            </button>
            <button
              onClick={() => move(1)}
              className="rounded-lg border border-line p-1.5 hover:bg-paper"
              aria-label="Mois suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {JOURS.map((j) => (
            <div key={j} className="pb-2 text-xs font-semibold text-mut">
              {j}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const dateStr = new Date(year, month, day).toDateString();
            const evs = byDay.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isSel = dateStr === selected;
            return (
              <button
                key={dateStr}
                onClick={() => setSelected(dateStr)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                  isSel
                    ? "bg-accent text-white"
                    : isToday
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-paper"
                }`}
              >
                <span className={isSel ? "font-bold" : ""}>{day}</span>
                {evs.length > 0 && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    {evs.slice(0, 3).map((e, k) => (
                      <span
                        key={k}
                        className={`h-1 w-1 rounded-full ${
                          isSel
                            ? "bg-white"
                            : e.type === "rdv"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      />
                    ))}
                    {evs.length > 3 && (
                      <span className={`text-[8px] font-bold leading-none ${isSel ? "text-white" : "text-mut"}`}>
                        +{evs.length - 3}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-4 text-xs text-mut">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Rendez-vous
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Rappel
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="mb-4 font-display text-base font-bold">
          {new Date(selected).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-mut">Rien de prévu ce jour.</p>
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((e) => {
              const time = new Date(e.date).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Paris",
              });
              return (
                <li key={e.id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      e.type === "rdv" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="w-12 shrink-0 text-xs font-semibold text-mut">{time}</span>
                  {e.href ? (
                    <Link href={e.href} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-accent">
                      {e.title}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                  )}
                  <form action={updateAppointmentStatus} className="flex shrink-0 gap-1">
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      name="status"
                      value="honore"
                      title={e.type === "rdv" ? "Marquer honoré" : "Marquer fait"}
                      className="rounded-md border border-line p-1 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      name="status"
                      value="annule"
                      title="Annuler"
                      className="rounded-md border border-line p-1 text-red-600 hover:bg-red-50"
                    >
                      <X size={13} />
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
