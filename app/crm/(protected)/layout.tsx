import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import Sidebar from "@/components/crm/Sidebar";
import { FicheProvider, FicheModalHost } from "@/components/crm/FicheModal";
import { RecordingProvider } from "@/components/crm/RecordingProvider";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAuthed()) redirect("/crm/login");

  return (
    <FicheProvider>
      <RecordingProvider>
      <div className="min-h-screen bg-paper text-ink">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="md:grid md:grid-cols-[228px_1fr] md:gap-10">
            <aside className="sticky top-0 z-20 -mx-5 border-b border-line bg-paper/90 px-5 py-3 backdrop-blur md:mx-0 md:max-h-screen md:border-b-0 md:px-0 md:py-7">
              <Link
                href="/crm"
                className="mb-4 hidden items-center gap-2.5 px-3.5 font-display text-lg font-bold tracking-tight md:flex"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Neela CRM
              </Link>
              <Sidebar />
            </aside>
            <main className="py-7">{children}</main>
          </div>
        </div>
      </div>
      <FicheModalHost />
      </RecordingProvider>
    </FicheProvider>
  );
}
