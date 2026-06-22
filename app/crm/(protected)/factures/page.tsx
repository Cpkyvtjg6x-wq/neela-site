import { getInvoices, getAllProspects } from "@/lib/crmData";
import FacturesApp from "@/components/crm/FacturesApp";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const [invoices, prospects] = await Promise.all([getInvoices(), getAllProspects()]);
  const centres = prospects
    .filter((p) => p.nom)
    .map((p) => ({ id: p.id, nom: p.nom as string, ville: p.ville, email: p.email, telephone: p.telephone }));
  return <FacturesApp invoices={invoices} centres={centres} />;
}
