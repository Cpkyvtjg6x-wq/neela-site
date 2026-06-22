import { getAllProspects } from "@/lib/crmData";
import { prospectScore } from "@/lib/crm";
import CallSession from "@/components/crm/CallSession";

export const dynamic = "force-dynamic";

// Statuts qui valent un appel (on exclut signé / pas intéressé / perdu).
const CALLABLE = new Set(["a_appeler", "a_rappeler", "r1_pose", "rdv_honore", "proposition"]);

export default async function SessionPage() {
  const prospects = await getAllProspects();
  const queue = prospects
    .filter((p) => CALLABLE.has(p.statut))
    .sort((a, b) => prospectScore(b) - prospectScore(a));
  return <CallSession queue={queue} />;
}
