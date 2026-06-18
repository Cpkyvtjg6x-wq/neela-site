"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Trash2 } from "lucide-react";
import { OUTCOMES, STATUTS, INTERETS } from "@/lib/crm";
import { addCall } from "@/app/crm/actions";
import TagInput from "./TagInput";

export default function InteractionForm({
  prospectId,
  defaultStatut,
  defaultInteret,
}: {
  prospectId: string;
  defaultStatut?: string;
  defaultInteret?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState("");
  const [tagKey, setTagKey] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // ---- Audio ----
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [recErr, setRecErr] = useState<string | null>(null);
  const [canRecord, setCanRecord] = useState(false);
  const [mime, setMime] = useState("");

  useEffect(() => {
    const ok =
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      "MediaRecorder" in window;
    setCanRecord(ok);
    if (ok) {
      const cands = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
      const MR = window.MediaRecorder as typeof MediaRecorder & {
        isTypeSupported?: (t: string) => boolean;
      };
      const found = cands.find((c) => MR.isTypeSupported?.(c));
      setMime(found || "");
    }
  }, []);

  async function startRec() {
    setRecErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = mr.mimeType || mime || "audio/webm";
        const b = new Blob(chunksRef.current, { type });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch (e) {
      const name = (e as Error)?.name;
      setRecErr(
        name === "NotAllowedError"
          ? "Accès au micro refusé. Autorise le micro dans les réglages du navigateur, puis réessaie."
          : "Micro indisponible sur cet appareil/navigateur."
      );
      setRecording(false);
    }
  }
  function stopRec() {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setRecording(false);
  }
  function clearRec() {
    setBlob(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    fd.set("prospect_id", prospectId);
    fd.set("outcome", outcome);
    if (blob) {
      const ext = blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a" : "webm";
      fd.append("audio", blob, `appel.${ext}`);
    }
    startTransition(async () => {
      try {
        await addCall(fd);
        formRef.current?.reset();
        setOutcome("");
        setTagKey((k) => k + 1);
        clearRec();
        router.refresh();
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
    <form ref={formRef} onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 font-display text-lg font-bold">Enregistrer un appel</h2>

      {/* Résultat en pastilles */}
      <p className={label}>Résultat</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {OUTCOMES.map((o) => {
          const on = outcome === o.key;
          return (
            <button
              type="button"
              key={o.key}
              onClick={() => setOutcome(on ? "" : o.key)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                on ? "bg-ink text-paper" : "border border-line text-mut hover:border-ink hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className={label}>Statut</p>
          <select name="statut" defaultValue={defaultStatut || ""} className={field}>
            <option value="">(inchangé)</option>
            {STATUTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={label}>Intérêt</p>
          <select name="interet" defaultValue={defaultInteret || ""} className={field}>
            <option value="">(inchangé)</option>
            {INTERETS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3">
        <p className={label}>Tags</p>
        <TagInput key={tagKey} name="tags" placeholder="ex : décideur absent…" />
      </div>

      <div className="mt-3">
        <p className={label}>Commentaire</p>
        <textarea name="notes" rows={3} className={field} placeholder="Ce qui s'est dit pendant l'appel…" />
      </div>

      <div className="mt-3">
        <p className={label}>Rendez-vous / rappel</p>
        <input type="datetime-local" name="rappel_at" className={field} />
      </div>

      {/* Enregistrement audio */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {canRecord ? (
          !recording ? (
            <button
              type="button"
              onClick={startRec}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
            >
              <Mic size={16} /> {blob ? "Réenregistrer" : "Enregistrer l'appel"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRec}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Square size={14} /> Arrêter
            </button>
          )
        ) : (
          <span className="text-xs text-mut">Micro non disponible sur ce navigateur.</span>
        )}
        {recording && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> enregistrement…
          </span>
        )}
        {blobUrl && !recording && (
          <>
            <audio controls src={blobUrl} className="h-9" />
            <button type="button" onClick={clearRec} className="text-mut hover:text-red-600" aria-label="Supprimer">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
      {recErr && <p className="mt-2 text-sm font-medium text-red-600">{recErr}</p>}
      {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={pending || recording}
        className="mt-5 w-full rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer l'appel"}
      </button>
    </form>
  );
}
