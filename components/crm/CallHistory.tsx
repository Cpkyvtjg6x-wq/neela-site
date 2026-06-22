"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Mic, Sparkles } from "lucide-react";
import type { Call } from "@/lib/crm";
import { OUTCOMES, INTERETS, outcomeLabel } from "@/lib/crm";
import { updateCall, deleteCall } from "@/app/crm/actions";
import { summarizeRecording } from "@/app/crm/ai-actions";
import TagInput from "./TagInput";
import Tag from "./Tag";
import ConfirmButton from "./ConfirmButton";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}
// ISO → valeur d'un <input datetime-local> en heure de Paris.
function isoToParisLocal(iso: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(iso))) p[x.type] = x.value;
  const h = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${h}:${p.minute}`;
}

function CallRow({ call, url, prospectId, aiEnabled }: { call: Call; url: string | null; prospectId: string; aiEnabled: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);

  function runAi() {
    setErr(null);
    setAiPending(true);
    summarizeRecording(call.id).then((r) => {
      setAiPending(false);
      if (r.ok) router.refresh();
      else setErr(r.error || "Analyse IA indisponible.");
    });
  }

  const [outcome, setOutcome] = useState(call.outcome ?? "");
  const [interet, setInteret] = useState(call.interet ?? "");
  const [tags, setTags] = useState<string[]>(call.tags ?? []);
  const [notes, setNotes] = useState(call.notes ?? "");
  const [rappel, setRappel] = useState(call.rappel_at ? isoToParisLocal(call.rappel_at) : "");
  const [rappelType, setRappelType] = useState<"rappel" | "r1">("rappel");

  const field = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set("call_id", call.id); fd.set("prospect_id", prospectId);
    fd.set("outcome", outcome); fd.set("interet", interet);
    fd.set("tags", tags.join(",")); fd.set("notes", notes);
    fd.set("rappel_at", rappel); fd.set("rappel_type", rappelType);
    start(async () => {
      try { await updateCall(fd); setEditing(false); router.refresh(); }
      catch (e) { setErr((e as Error)?.message || "Erreur lors de l'enregistrement."); }
    });
  }
  function del() {
    const fd = new FormData(); fd.set("call_id", call.id);
    return deleteCall(fd).then(() => router.refresh());
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-white p-4">
        <p className={label}>Résultat</p>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={`${field} mt-1`}>
          <option value="">—</option>
          {OUTCOMES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <p className={`${label} mt-3`}>Intérêt</p>
        <select value={interet} onChange={(e) => setInteret(e.target.value)} className={`${field} mt-1`}>
          <option value="">(inchangé)</option>
          {INTERETS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <p className={`${label} mt-3`}>Tags</p>
        <TagInput value={tags} onChange={setTags} />
        <p className={`${label} mt-3`}>Notes</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={`${field} mt-1`} />
        <p className={`${label} mt-3`}>Rappel</p>
        <input type="datetime-local" value={rappel} onChange={(e) => setRappel(e.target.value)} className={`${field} mt-1`} />
        {rappel && (
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setRappelType("rappel")} className={`rounded-full px-3 py-1 text-xs font-semibold ${rappelType === "rappel" ? "bg-amber-500 text-white" : "border border-line text-mut"}`}>● Rappel</button>
            <button type="button" onClick={() => setRappelType("r1")} className={`rounded-full px-3 py-1 text-xs font-semibold ${rappelType === "r1" ? "bg-emerald-600 text-white" : "border border-line text-mut"}`}>● R1</button>
          </div>
        )}
        {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}
        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={pending} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent disabled:opacity-60">{pending ? "…" : "Enregistrer"}</button>
          <button onClick={() => setEditing(false)} disabled={pending} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-mut hover:text-ink">Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-ink">{outcomeLabel(call.outcome)}</span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-mut">{fmt(call.created_at)}</span>
          {aiEnabled && call.recording_path && (
            <button onClick={runAi} disabled={aiPending} title="Résumer l'appel avec l'IA" className="rounded-md border border-line p-1 text-purple-600 hover:bg-purple-50 disabled:opacity-50"><Sparkles size={13} /></button>
          )}
          <button onClick={() => setEditing(true)} title="Modifier" className="rounded-md border border-line p-1 text-mut hover:text-ink"><Pencil size={13} /></button>
          <ConfirmButton title="Supprimer cet appel ?" message="L'appel et son enregistrement audio seront supprimés." confirmLabel="Supprimer" danger onConfirm={del}
            className="rounded-md border border-line p-1 text-red-600 hover:bg-red-50"><Trash2 size={13} /></ConfirmButton>
        </div>
      </div>
      {call.notes && <p className="mt-2 whitespace-pre-wrap text-[13px] text-ink/80">{call.notes}</p>}
      {call.tags && call.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">{call.tags.map((t) => <Tag key={t} label={t} hash />)}</div>
      )}
      {url && <audio controls src={url} className="mt-3 h-9 w-full" />}
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-mut">
        {call.recording_path && <span className="inline-flex items-center gap-1 text-accent"><Mic size={12} /> audio</span>}
        {call.rappel_at && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">Rappel : {fmt(call.rappel_at)}</span>}
      </div>
      {aiPending && <p className="mt-2 text-[12px] text-mut">Analyse IA en cours…</p>}
      {err && <p className="mt-2 text-[12px] font-medium text-red-600">{err}</p>}
    </div>
  );
}

export default function CallHistory({ calls, audio, prospectId, aiEnabled = false }: { calls: Call[]; audio: Record<string, string>; prospectId: string; aiEnabled?: boolean }) {
  if (calls.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mut">
        Aucun appel encore. Enregistre ta première interaction à gauche.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {calls.map((c) => <CallRow key={c.id} call={c} url={audio[c.id] ?? null} prospectId={prospectId} aiEnabled={aiEnabled} />)}
    </div>
  );
}
