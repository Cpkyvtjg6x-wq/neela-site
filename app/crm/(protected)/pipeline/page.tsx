import { getAllProspects } from "@/lib/crmData";
import Pipeline from "@/components/crm/Pipeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const prospects = await getAllProspects();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-mut">Glisse une carte d'une colonne à l'autre pour changer son statut. Clique pour ouvrir la fiche.</p>
      </div>
      <Pipeline prospects={prospects} />
    </div>
  );
}
