import { Phone, Tag as TagIcon, Clock, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { statutLabel, outcomeLabel } from "@/lib/crm";
import type { Activity } from "@/lib/crmData";

function fmt(d: string) {
  return new Date(d).toLocaleString("fr-FR", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

function describe(a: Activity): { icon: React.ReactNode; text: string; color: string } {
  const p = a.payload || {};
  switch (a.type) {
    case "call":
      return { icon: <Phone size={13} />, text: `Appel — ${outcomeLabel((p.outcome as string) ?? null)}`, color: "#2563eb" };
    case "statut":
      return { icon: <TagIcon size={13} />, text: `Statut : ${statutLabel((p.from as string) ?? null)} → ${statutLabel((p.to as string) ?? null)}`, color: "#7c3aed" };
    case "rappel":
      return { icon: <Clock size={13} />, text: "Rappel programmé", color: "#d97706" };
    case "r1":
      return { icon: <CalendarDays size={13} />, text: "RDV (R1) programmé", color: "#059669" };
    case "rdv":
      return { icon: <CalendarDays size={13} />, text: "Rendez-vous ajouté", color: "#059669" };
    case "call_edit":
      return { icon: <Pencil size={13} />, text: "Appel modifié", color: "#64748b" };
    case "call_delete":
      return { icon: <Trash2 size={13} />, text: "Appel supprimé", color: "#dc2626" };
    default:
      return { icon: <Clock size={13} />, text: a.type, color: "#64748b" };
  }
}

export default function Timeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mut">L'activité (appels, changements de statut, RDV) apparaîtra ici au fil du temps.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {activities.map((a) => {
        const d = describe(a);
        return (
          <li key={a.id} className="relative">
            <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-white" style={{ color: d.color }}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: d.color + "1a" }}>{d.icon}</span>
            </span>
            <p className="text-[13.5px] font-medium text-ink">{d.text}</p>
            <p className="text-[12px] text-mut">{fmt(a.created_at)}</p>
          </li>
        );
      })}
    </ol>
  );
}
