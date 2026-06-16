import { getDb } from "@/lib/supabaseAdmin";
import type { Prospect } from "@/lib/crm";
import ProspectList from "@/components/crm/ProspectList";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  const db = getDb();
  const { data, error } = await db
    .from("neela_prospects")
    .select("*")
    .order("interet", { ascending: true })
    .order("departement", { ascending: true })
    .order("ville", { ascending: true });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Erreur de chargement : {error.message}
      </div>
    );
  }

  const prospects = (data ?? []) as Prospect[];
  const total = prospects.length;
  const chauds = prospects.filter((p) => p.interet === "chaud").length;
  const aAppeler = prospects.filter((p) => p.statut === "a_appeler").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Prospects
          </h1>
          <p className="mt-1 text-sm text-mut">
            {total} centres · {chauds} chauds · {aAppeler} à appeler
          </p>
        </div>
      </div>

      <ProspectList prospects={prospects} />
    </div>
  );
}
