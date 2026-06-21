import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/supabaseAdmin";
import type { Prospect, Call } from "@/lib/crm";
import { outcomeLabel, interetMeta, regionForDept, statutLabel } from "@/lib/crm";
import InteractionForm from "@/components/crm/InteractionForm";
import ProspectInfoForm from "@/components/crm/ProspectInfoForm";
import Tag from "@/components/crm/Tag";

export const dynamic = "force-dynamic";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export default async function ProspectPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const { data: prospect } = await db.from("neela_prospects").select("*").eq("id", params.id).single();
  if (!prospect) notFound();
  const p = prospect as Prospect;

  const { data: callsData } = await db
    .from("neela_calls").select("*").eq("prospect_id", params.id).order("created_at", { ascending: false });
  const calls = (callsData ?? []) as Call[];

  // URLs audio signées en UNE seule requête groupée (au lieu d'une par appel = lent).
  const recCalls = calls.filter((c) => c.recording_path);
  const urlMap = new Map<string, string | null>();
  if (recCalls.length) {
    const { data: signedList } = await db.storage
      .from("neela-recordings")
      .createSignedUrls(recCalls.map((c) => c.recording_path as string), 3600);
    (signedList ?? []).forEach((s, i) => {
      urlMap.set(recCalls[i].id, s.signedUrl ?? null);
    });
  }

  const im = interetMeta(p.interet);

  return (
    <div>
      <Link href="/crm/prospects" className="text-sm text-mut hover:text-accent">← Prospects</Link>

      {/* En-tête */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {im && (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: im.color }}>
                {im.label}
              </span>
            )}
            <h1 className="font-display text-2xl font-bold tracking-tight">{p.nom}</h1>
            <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-mut">
              {statutLabel(p.statut)}
            </span>
          </div>
          <p className="mt-1 text-sm text-mut">
            {p.ville} ({p.departement}) · {regionForDept(p.departement)} · {p.centre}
          </p>
          {p.tags && p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.tags.map((t) => <Tag key={t} label={t} />)}
            </div>
          )}
        </div>
        {p.telephone && (
          <a href={`tel:${p.telephone.replace(/\s/g, "")}`}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent">
            Appeler {p.telephone}
          </a>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Colonne gauche : le bloc unique d'interaction + coordonnées */}
        <div className="space-y-6">
          <InteractionForm prospectId={p.id} prospectName={p.nom} />

          {/* Fiche & coordonnées — tout est corrigeable ici */}
          <ProspectInfoForm p={p} />
        </div>

        {/* Colonne droite : historique */}
        <div>
          <h2 className="mb-4 font-display text-lg font-bold">Historique des appels</h2>
          {calls.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mut">
              Aucun appel encore. Enregistre ta première interaction à gauche.
            </p>
          ) : (
            <div className="space-y-3">
              {calls.map((c) => {
                const url = urlMap.get(c.id);
                return (
                  <div key={c.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-ink">{outcomeLabel(c.outcome)}</span>
                      <span className="text-[12px] text-mut">{fmt(c.created_at)}</span>
                    </div>
                    {c.notes && <p className="mt-2 whitespace-pre-wrap text-[13px] text-ink/80">{c.notes}</p>}
                    {c.tags && c.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.tags.map((t) => <Tag key={t} label={t} hash />)}
                      </div>
                    )}
                    {url && <audio controls src={url} className="mt-3 h-9 w-full" />}
                    {c.rappel_at && (
                      <p className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700">
                        Rappel : {fmt(c.rappel_at)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
