import AdPlanner from "@/components/crm/AdPlanner";
import { getAllProspects } from "@/lib/crmData";

export const dynamic = "force-dynamic";

export default async function AdPlannerPage() {
  const prospects = await getAllProspects();
  const centres = prospects
    .filter((p) => p.nom)
    .map((p) => ({ nom: p.nom as string, ville: p.ville }));
  return <AdPlanner centres={centres} />;
}
