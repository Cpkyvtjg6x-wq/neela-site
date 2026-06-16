import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProspects } from "@/lib/crmData";
import ProspectList from "@/components/crm/ProspectList";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const prospects = await getAllProspects();
  const chauds = prospects.filter((p) => p.interet === "chaud").length;
  const aAppeler = prospects.filter((p) => p.statut === "a_appeler").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Prospects</h1>
          <p className="mt-1 text-sm text-mut">
            {prospects.length} centres · {chauds} chauds · {aAppeler} à appeler
          </p>
        </div>
        <Link
          href="/crm/prospects/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent"
        >
          <Plus size={16} /> Nouveau prospect
        </Link>
      </div>
      <ProspectList prospects={prospects} />
    </div>
  );
}
