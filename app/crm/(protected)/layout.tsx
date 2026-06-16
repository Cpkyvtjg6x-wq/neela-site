import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAuthed()) redirect("/crm/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link
            href="/crm"
            className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            Neela CRM
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-mut">
            <Link href="/crm" className="hover:text-ink">
              Prospects
            </Link>
            <form action={logout}>
              <button type="submit" className="hover:text-ink">
                Déconnexion
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
