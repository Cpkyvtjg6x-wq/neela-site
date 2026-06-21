"use client";

import { useState } from "react";
import AgendaView, { type AgendaItem } from "./AgendaView";
import WeekCalendar from "./WeekCalendar";

export default function AgendaTabs({ items, nowISO }: { items: AgendaItem[]; nowISO: string }) {
  const [view, setView] = useState<"week" | "day" | "list">("week");

  const tab = (v: typeof view, label: string) => (
    <button
      onClick={() => setView(v)}
      className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        view === v ? "bg-ink text-paper" : "text-mut hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 inline-flex rounded-xl border border-line bg-white p-1">
        {tab("week", "Semaine")}
        {tab("day", "Jour")}
        {tab("list", "Liste")}
      </div>

      {view === "list" ? (
        <AgendaView items={items} nowISO={nowISO} />
      ) : (
        <WeekCalendar items={items} nowISO={nowISO} days={view === "week" ? 7 : 1} />
      )}
    </div>
  );
}
