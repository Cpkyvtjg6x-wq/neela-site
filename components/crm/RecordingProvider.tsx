"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Mic } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { useFiche } from "./FicheModal";

// Format mm:ss à partir d'une durée en millisecondes.
export function fmtElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Brouillon de saisie d'un appel, conservé par prospect tant qu'il n'est pas enregistré.
export type CallDraft = {
  outcome: string;
  interet: string;
  tags: string[];
  notes: string;
  rappelAt: string; // valeur d'un <input datetime-local>
  rappelType: "rappel" | "r1";
};

export const EMPTY_DRAFT: CallDraft = {
  outcome: "",
  interet: "",
  tags: [],
  notes: "",
  rappelAt: "",
  rappelType: "rappel",
};

type RecCtxValue = {
  active: boolean; // enregistrement en cours OU prise en attente d'enregistrement
  recording: boolean; // capture micro en cours
  prospectId: string | null;
  prospectName: string | null;
  elapsedMs: number;
  blob: Blob | null;
  blobUrl: string | null;
  canRecord: boolean;
  error: string | null;
  start: (prospectId: string, name?: string | null) => Promise<void>;
  stop: () => void;
  discard: () => void;
  // Brouillons de formulaire, persistés par prospect.
  getDraft: (prospectId: string) => CallDraft;
  patchDraft: (prospectId: string, patch: Partial<CallDraft>) => void;
  clearDraft: (prospectId: string) => void;
};

const RecCtx = createContext<RecCtxValue | null>(null);

export function useRecorder(): RecCtxValue {
  const ctx = useContext(RecCtx);
  if (!ctx) throw new Error("useRecorder doit être utilisé dans <RecordingProvider>.");
  return ctx;
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const { open, openId } = useFiche();

  const [recording, setRecording] = useState(false);
  const [prospectId, setProspectId] = useState<string | null>(null);
  const [prospectName, setProspectName] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [canRecord, setCanRecord] = useState(false);
  const [mime, setMime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CallDraft>>({});

  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setMime(cands.find((c) => MR.isTypeSupported?.(c)) || "");
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    async (pid: string, name?: string | null) => {
      if (recording) return;
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size) chunksRef.current.push(e.data);
        };
        mr.onstop = () => {
          const type = mr.mimeType || mime || "audio/webm";
          const b = new Blob(chunksRef.current, { type });
          setBlob(b);
          setBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(b);
          });
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setRecording(false);
          stopTimer();
        };
        // Réinitialise une éventuelle prise précédente.
        setBlob(null);
        setBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setProspectId(pid);
        setProspectName(name ?? null);
        setElapsedMs(0);
        startTsRef.current = Date.now();
        stopTimer();
        timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTsRef.current), 500);
        mr.start();
        recRef.current = mr;
        setRecording(true);
      } catch (e) {
        const nm = (e as Error)?.name;
        setError(
          nm === "NotAllowedError"
            ? "Accès au micro refusé. Autorise le micro dans le navigateur, puis réessaie."
            : "Micro indisponible sur cet appareil/navigateur."
        );
        setRecording(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        stopTimer();
      }
    },
    [recording, mime, stopTimer]
  );

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const discard = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopTimer();
    setRecording(false);
    setBlob(null);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setProspectId(null);
    setProspectName(null);
    setElapsedMs(0);
    setError(null);
  }, [stopTimer]);

  // Nettoyage à la sortie du CRM (déconnexion, fermeture) : on coupe le micro.
  useEffect(
    () => () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const getDraft = useCallback(
    (pid: string): CallDraft => drafts[pid] ?? EMPTY_DRAFT,
    [drafts]
  );
  const patchDraft = useCallback((pid: string, patch: Partial<CallDraft>) => {
    setDrafts((d) => ({ ...d, [pid]: { ...(d[pid] ?? EMPTY_DRAFT), ...patch } }));
  }, []);
  const clearDraft = useCallback((pid: string) => {
    setDrafts((d) => {
      if (!(pid in d)) return d;
      const next = { ...d };
      delete next[pid];
      return next;
    });
  }, []);

  const active = recording || !!blob;
  const value: RecCtxValue = {
    active,
    recording,
    prospectId,
    prospectName,
    elapsedMs,
    blob,
    blobUrl,
    canRecord,
    error,
    start,
    stop,
    discard,
    getDraft,
    patchDraft,
    clearDraft,
  };

  // La bulle n'apparaît que si un enregistrement est actif ET que la fiche
  // concernée n'est pas déjà ouverte (sinon le formulaire affiche déjà les contrôles).
  const showBubble = active && !!prospectId && openId !== prospectId;

  return (
    <RecCtx.Provider value={value}>
      {children}
      {showBubble && (
        <button
          type="button"
          onClick={() =>
            prospectId && open(prospectId, { id: prospectId, nom: prospectName } as Prospect)
          }
          title="Revenir à l'enregistrement en cours"
          className="fixed right-4 top-4 z-[60] flex items-center gap-2.5 rounded-full border border-line bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur transition-colors hover:border-ink"
        >
          {recording ? (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
          ) : (
            <Mic size={15} className="shrink-0 text-amber-600" />
          )}
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[13px] font-bold text-ink">
              {recording ? `● ${fmtElapsed(elapsedMs)}` : "Prise à sauvegarder"}
            </span>
            <span className="max-w-[150px] truncate text-[11px] text-mut">
              {prospectName || "Prospect"}
            </span>
          </span>
          <span className="ml-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">
            Reprendre
          </span>
        </button>
      )}
    </RecCtx.Provider>
  );
}
