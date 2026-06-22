"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Headphones,
  Columns3,
  AlarmClock,
  CalendarDays,
  PhoneCall,
  BarChart3,
  Calculator,
  FileText,
  Upload,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/crm/actions";

const NAV = [
  { href: "/crm", label: "Tableau de bord", icon: LayoutDashboard, match: (p: string) => p === "/crm" },
  { href: "/crm/prospects", label: "Prospects", icon: Users, match: (p: string) => p.startsWith("/crm/prospect") },
  { href: "/crm/session", label: "Session d'appels", icon: Headphones, match: (p: string) => p.startsWith("/crm/session") },
  { href: "/crm/pipeline", label: "Pipeline", icon: Columns3, match: (p: string) => p.startsWith("/crm/pipeline") },
  { href: "/crm/relances", label: "Relances", icon: AlarmClock, match: (p: string) => p.startsWith("/crm/relances") },
  { href: "/crm/agenda", label: "Agenda", icon: CalendarDays, match: (p: string) => p.startsWith("/crm/agenda") },
  { href: "/crm/journal", label: "Journal", icon: PhoneCall, match: (p: string) => p.startsWith("/crm/journal") },
  { href: "/crm/stats", label: "Statistiques", icon: BarChart3, match: (p: string) => p.startsWith("/crm/stats") },
  { href: "/crm/ad-planner", label: "Ad Planner", icon: Calculator, match: (p: string) => p.startsWith("/crm/ad-planner") },
  { href: "/crm/factures", label: "Factures", icon: FileText, match: (p: string) => p.startsWith("/crm/factures") },
  { href: "/crm/import", label: "Import", icon: Upload, match: (p: string) => p.startsWith("/crm/import") },
];

export default function Sidebar() {
  const path = usePathname() || "/crm";

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
      {NAV.map((n) => {
        const active = n.match(path);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent"
                : "text-mut hover:bg-white hover:text-ink"
            }`}
          >
            <Icon size={18} strokeWidth={2} />
            {n.label}
          </Link>
        );
      })}
      <form action={logout} className="md:mt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium text-mut transition-colors hover:bg-white hover:text-ink"
        >
          <LogOut size={18} strokeWidth={2} />
          Déconnexion
        </button>
      </form>
    </nav>
  );
}
