"use client";

import { useState, useTransition } from "react";

// Bouton qui ouvre une modale de confirmation avant d'exécuter une action.
export default function ConfirmButton({
  children, title, message, confirmLabel = "Confirmer", danger = false, onConfirm, className,
}: {
  children: React.ReactNode;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <>
      <button type="button" className={className} onClick={() => { setErr(null); setOpen(true); }}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !pending) setOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-display text-lg font-bold">{title}</h3>
            {message && <p className="mt-2 text-sm text-mut">{message}</p>}
            {err && <p className="mt-2 text-sm font-medium text-red-600">{err}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={pending} onClick={() => setOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-mut hover:text-ink disabled:opacity-60">
                Annuler
              </button>
              <button type="button" disabled={pending}
                onClick={() => start(async () => {
                  try { await onConfirm(); setOpen(false); }
                  catch (e) { setErr((e as Error)?.message || "Erreur."); }
                })}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-ink hover:bg-accent"}`}>
                {pending ? "…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
