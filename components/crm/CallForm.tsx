"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Trash2 } from "lucide-react";
import { OUTCOMES, STATUTS, INTERETS } from "@/lib/crm";
import { addCall } from "@/app/crm/actions";
import TagInput from "./TagInput";

export default function CallForm({ prospectId }: { prospectId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const [recording, setRecording] = useState(false);
  const [tagKey, setTagKey] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [canRecord, setCanRecord] = useState(false);
  useEffect(() => {
    setCanRecord(!!navigator.mediaDevices && "MediaRecorder" in window);
  }, []);

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: "audio/webm" });
        setBlob(b);
        setBlobUrl(URL.createObjectURL(b));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch {
      alert("Micro indisponible ou refusé.");
    }
  }
  function stopRec() {
    recRef.current?.stop();
    setRecording(false);
  }
  function clearRec() {
    setBlob(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("prospect_id", prospectId);
    if (blob) fd.append("audio", blob, "appel.webm");
    startTransition(async () => {
      await addCall(fd);
      formRef.current?.reset();
      clearRec();
      setTagKey((k) => k + 1);
      router.refresh();
    });
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-white p-5"
    >
      <h2 className="mb-4 font-display text-lg font-bold">Enregistrer un appel</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className={label}>Résultat</p>
          <select name="outcome" defaultValue="" className={field}>
            <option value="">—</option>
            {OUTCOMES.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={label}>Rappel le</p>
          <input type="datetime-local" name="rappel_at" className={field} />
        </div>
        <div>
          <p className={label}>Nouveau statut</p>
          <select name="statut" defaultValue="" className={field}>
            <option value="">(inchangé)</option>
            {STATUTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className={label}>Nouvel intérêt</p>
          <select name="interet" defaultValue="" className={field}>
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
        <TagInput key={tagKey} name="tags" placeholder="ex : décideur absent, à relancer…" />
      </div>

      <div className="mt-3">
        <p className={label}>Notes d'appel</p>
        <textarea name="notes" rows={3} className={field} />
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
            <button
              type="button"
              onClick={clearRec}
              className="text-mut hover:text-red-600"
              aria-label="Supprimer l'enregistrement"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || recording}
        className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Ajouter l'appel"}
      </button>
    </form>
  );
}
