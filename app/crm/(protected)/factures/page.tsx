import { getInvoices, getAllProspects } from "@/lib/crmData";
import FacturesApp from "@/components/crm/FacturesApp";

export const dynamic = "force-dynamic";

export default async function FacturesPage({ searchParams }: { searchParams: { new?: string; prospect?: string } }) {
  const [invoices, prospects] = await Promise.all([getInvoices(), getAllProspects()]);
  const centres = prospects
    .filter((p) => p.nom)
    .map((p) => ({ id: p.id, nom: p.nom as string, ville: p.ville, email: p.email, telephone: p.telephone }));

  // Liaison interne : ouverture directe d'une nouvelle facture pré-remplie pour un prospect.
  let openProspect: { id: string; nom: string; email: string | null } | undefined;
  if (searchParams.new && searchParams.prospect) {
    const p = prospects.find((x) => x.id === searchParams.prospect);
    if (p?.nom) openProspect = { id: p.id, nom: p.nom, email: p.email };
  }

  return <FacturesApp invoices={invoices} centres={centres} openProspect={openProspect} />;
}
