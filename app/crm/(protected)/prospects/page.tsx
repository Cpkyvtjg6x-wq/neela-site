import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProspects, getContactedProspectIds } from "@/lib/crmData";
import ProspectList from "@/components/crm/ProspectList";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  const [prospects, contacted] = await Promise.all([getAllProspects(), getContactedProspectIds()]);
  const aContacter = prospects.filter((p) => !contacted.has(p.id));
  const chauds = aContacter.filter((p) => p.interet === "chaud").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Prospects à contacter</h1>
          <p className="mt-1 text-sm text-mut">
            {aContacter.length} à contacter · {chauds} chauds ·{" "}
            <Link href="/crm/journal" className="text-accent hover:underline">
              {contacted.size} déjà contactés →
            </Link>
          </p>
        </div>
        <Link href="/crm/prospects/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent">
          <Plus size={16} /> Nouveau prospect
        </Link>
      </div>
      <ProspectList prospects={aContacter} />
    </div>
  );
}
