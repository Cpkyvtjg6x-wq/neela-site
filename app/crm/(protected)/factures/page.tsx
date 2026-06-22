import { getInvoices, getAllProspects } from "@/lib/crmData";
import FacturesApp, { type Prefill } from "@/components/crm/FacturesApp";

export const dynamic = "force-dynamic";

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: { new?: string; prospect?: string; client?: string; type?: string; budget?: string; fee?: string };
}) {
  const [invoices, prospects] = await Promise.all([getInvoices(), getAllProspects()]);
  const centres = prospects
    .filter((p) => p.nom)
    .map((p) => ({ id: p.id, nom: p.nom as string, ville: p.ville, email: p.email, telephone: p.telephone }));

  // Liaisons internes : ouverture directe d'un document pré-rempli.
  let prefill: Prefill | undefined;
  if (searchParams.prospect) {
    const p = prospects.find((x) => x.id === searchParams.prospect);
    if (p?.nom) prefill = { prospectId: p.id, nom: p.nom, email: p.email };
  } else if (searchParams.client || searchParams.budget || searchParams.fee) {
    // Depuis l'Ad Planner : devis pré-rempli budget pub + honoraires.
    const budget = Number(searchParams.budget) || 0;
    const fee = Number(searchParams.fee) || 0;
    const items: { designation: string; qty: number; unit: number }[] = [];
    if (budget > 0) items.push({ designation: "Budget publicitaire Meta Ads (1 mois)", qty: 1, unit: budget });
    if (fee > 0) items.push({ designation: "Honoraires de gestion Neela (1 mois)", qty: 1, unit: fee });
    prefill = {
      nom: searchParams.client || "",
      docType: searchParams.type === "devis" ? "devis" : "facture",
      items: items.length ? items : undefined,
    };
  }

  return <FacturesApp invoices={invoices} centres={centres} prefill={prefill} />;
}
