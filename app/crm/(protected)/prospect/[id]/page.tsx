import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Calculator } from "lucide-react";
import { getDb } from "@/lib/supabaseAdmin";
import { getProspectActivity } from "@/lib/crmData";
import { aiEnabled } from "@/lib/ai";
import type { Prospect, Call } from "@/lib/crm";
import { interetMeta, regionForDept, statutLabel } from "@/lib/crm";
import InteractionForm from "@/components/crm/InteractionForm";
import ProspectInfoForm from "@/components/crm/ProspectInfoForm";
import CallHistory from "@/components/crm/CallHistory";
import Timeline from "@/components/crm/Timeline";
import DeleteProspectButton from "@/components/crm/DeleteProspectButton";
import SmsTemplates from "@/components/crm/SmsTemplates";
import Tag from "@/components/crm/Tag";

export const dynamic = "force-dynamic";

export default async function ProspectPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const { data: prospect } = await db.from("neela_prospects").select("*").eq("id", params.id).single();
  if (!prospect) notFound();
  const p = prospect as Prospect;

  const [callsRes, activities] = await Promise.all([
    db.from("neela_calls").select("*").eq("prospect_id", params.id).order("created_at", { ascending: false }),
    getProspectActivity(params.id),
  ]);
  const calls = (callsRes.data ?? []) as Call[];

  // URLs audio signées en UNE seule requête groupée.
  const recCalls = calls.filter((c) => c.recording_path);
  const audio: Record<string, string> = {};
  if (recCalls.length) {
    const { data: signedList } = await db.storage
      .from("neela-recordings")
      .createSignedUrls(recCalls.map((c) => c.recording_path as string), 3600);
    (signedList ?? []).forEach((s, i) => {
      if (s.signedUrl) audio[recCalls[i].id] = s.signedUrl;
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
        <div className="flex flex-col items-end gap-2">
          {p.telephone && (
            <a href={`tel:${p.telephone.replace(/\s/g, "")}`}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent">
              Appeler {p.telephone}
            </a>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href={`/crm/factures?new=1&prospect=${p.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent">
              <FileText size={13} /> Facturer
            </Link>
            <Link href={`/crm/ad-planner?ville=${encodeURIComponent(p.ville ?? "")}&centre=${encodeURIComponent(p.nom ?? "")}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent">
              <Calculator size={13} /> Simuler
            </Link>
            <DeleteProspectButton id={p.id} nom={p.nom} />
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Colonne gauche : interaction + coordonnées */}
        <div className="space-y-6">
          <InteractionForm prospectId={p.id} prospectName={p.nom} />
          <ProspectInfoForm p={p} />
          {p.telephone && (
            <div className="rounded-2xl border border-line bg-white p-5">
              <SmsTemplates phone={p.telephone} nom={p.nom} />
            </div>
          )}
        </div>

        {/* Colonne droite : historique éditable + timeline */}
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-display text-lg font-bold">Historique des appels</h2>
            <CallHistory calls={calls} audio={audio} prospectId={p.id} aiEnabled={aiEnabled()} />
          </div>
          <div>
            <h2 className="mb-4 font-display text-lg font-bold">Activité</h2>
            <Timeline activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
