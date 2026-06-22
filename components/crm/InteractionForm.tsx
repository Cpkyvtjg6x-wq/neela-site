"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Trash2 } from "lucide-react";
import { OUTCOMES, INTERETS } from "@/lib/crm";
import { addCall } from "@/app/crm/actions";
import { NOTE_TEMPLATES, fillTemplate } from "@/lib/templates";
import TagInput from "./TagInput";
import { useRecorder, fmtElapsed } from "./RecordingProvider";

export default function InteractionForm({
  prospectId,
  prospectName,
  onSaved,
}: {
  prospectId: string;
  prospectName?: string | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // Enregistreur + brouillon globaux (survivent à la navigation et à la fermeture de la fiche).
  const rec = useRecorder();
  const d = rec.getDraft(prospectId);
  const set = (patch: Parameters<typeof rec.patchDraft>[1]) => rec.patchDraft(prospectId, patch);

  const mine = rec.prospectId === prospectId; // l'enregistrement courant concerne CE prospect
  const isRecording = rec.recording && mine;
  const hasBlob = !!rec.blob && mine;
  const otherActive = rec.active && !mine; // un enregistrement tourne pour un AUTRE prospect

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData();
    fd.set("prospect_id", prospectId);
    fd.set("outcome", d.outcome);
    fd.set("interet", d.interet);
    fd.set("notes", d.notes);
    fd.set("tags", d.tags.join(","));
    fd.set("rappel_at", d.rappelAt);
    fd.set("rappel_type", d.rappelType);
    if (rec.blob && rec.prospectId === prospectId) {
      const ext = rec.blob.type.includes("mp4") || rec.blob.type.includes("m4a") ? "m4a" : "webm";
      fd.append("audio", rec.blob, `appel.${ext}`);
    }
    startTransition(async () => {
      try {
        await addCall(fd);
        rec.clearDraft(prospectId);
        if (rec.prospectId === prospectId) rec.discard();
        router.refresh();
        onSaved?.();
      } catch {
        setErr(
          "Erreur lors de l'enregistrement. Si l'audio est très long, réessaie sans l'enregistrement."
        );
      }
    });
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 font-display text-lg font-bold">Enregistrer un appel</h2>

      {/* Résultat en pastilles */}
      <p className={label}>Résultat</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {OUTCOMES.map((o) => {
          const on = d.outcome === o.key;
          return (
            <button
              type="button"
              key={o.key}
              onClick={() => set({ outcome: on ? "" : o.key })}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                on ? "bg-ink text-paper" : "border border-line text-mut hover:border-ink hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Intérêt en pastilles */}
      <p className={`${label} mt-4`}>Intérêt</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {INTERETS.map((it) => {
          const on = d.interet === it.key;
          return (
            <button
              type="button"
              key={it.key}
              onClick={() => set({ interet: on ? "" : it.key })}
              className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
              style={
                on
                  ? { background: it.color, color: "#fff" }
                  : { border: `1px solid ${it.color}`, color: it.color }
              }
            >
              {it.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className={label}>Tags</p>
        <TagInput value={d.tags} onChange={(tags) => set({ tags })} placeholder="ex : décideur absent…" />
      </div>

      <div className="mt-3">
        <p className={label}>Commentaire</p>
        <div className="mb-1.5 mt-1 flex flex-wrap gap-1.5">
          {NOTE_TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.label}
              onClick={() => set({ notes: (d.notes.trim() ? d.notes.trim() + "\n" : "") + fillTemplate(t.text, { nom: prospectName ?? "" }) })}
              className="rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-mut hover:border-accent hover:text-accent"
            >
              + {t.label}
            </button>
          ))}
        </div>
        <textarea
          value={d.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={3}
          className={field}
          placeholder="Ce qui s'est dit pendant l'appel…"
        />
      </div>

      <div className="mt-3">
        <p className={label}>Rendez-vous / rappel</p>
        <input
          type="datetime-local"
          value={d.rappelAt}
          onChange={(e) => set({ rappelAt: e.target.value })}
          className={field}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => set({ rappelType: "rappel" })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              d.rappelType === "rappel" ? "bg-amber-500 text-white" : "border border-line text-mut hover:border-ink"
            }`}
          >
            ● Rappel simple
          </button>
          <button
            type="button"
            onClick={() => set({ rappelType: "r1" })}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              d.rappelType === "r1" ? "bg-emerald-600 text-white" : "border border-line text-mut hover:border-ink"
            }`}
          >
            ● RDV (R1)
          </button>
        </div>
        <p className="mt-1 text-[11px] text-mut">Le rappel apparaît dans l'agenda — orange (rappel) ou vert (R1).</p>
      </div>

      {/* Enregistrement audio (global : continue même si tu changes de section) */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!rec.canRecord ? (
          <span className="text-xs text-mut">Micro non disponible sur ce navigateur.</span>
        ) : otherActive ? (
          <span className="text-xs font-medium text-amber-700">
            Un enregistrement est déjà en cours pour « {rec.prospectName || "un autre prospect"} ». Termine-le avant d'en lancer un autre.
          </span>
        ) : !isRecording ? (
          <button
            type="button"
            onClick={() => rec.start(prospectId, prospectName ?? null)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
          >
            <Mic size={16} /> {hasBlob ? "Réenregistrer" : "Enregistrer l'appel"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => rec.stop()}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <Square size={14} /> Arrêter
          </button>
        )}
        {isRecording && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> {fmtElapsed(rec.elapsedMs)}
          </span>
        )}
        {hasBlob && !isRecording && rec.blobUrl && (
          <>
            <audio controls src={rec.blobUrl} className="h-9" />
            <button
              type="button"
              onClick={() => rec.discard()}
              className="text-mut hover:text-red-600"
              aria-label="Supprimer l'enregistrement"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
      {rec.error && mine && <p className="mt-2 text-sm font-medium text-red-600">{rec.error}</p>}
      {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={pending || isRecording}
        className="mt-5 w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer l'appel"}
      </button>
    </form>
  );
}
