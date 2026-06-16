"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { importCall } from "@/app/crm/actions";

export default function ImportPage() {
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0, audios: 0, errors: 0 });
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRunning(true);
    setFinished(false);
    setStatus("Lecture du fichier…");

    let data: any;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setStatus("Fichier JSON invalide.");
      setRunning(false);
      return;
    }

    const prospects: any[] = data.prospects || [];
    const calls: any[] = data.calls || [];
    const map = new Map<string, { nom: string; ville: string }>();
    for (const p of prospects) map.set(p.id, { nom: p.nom, ville: p.ville });

    let done = 0,
      audios = 0,
      errors = 0;
    setProgress({ done: 0, total: calls.length, audios: 0, errors: 0 });

    for (const c of calls) {
      const p = map.get(c.prospectId) || { nom: "", ville: "" };
      const fd = new FormData();
      fd.set("nom", p.nom || "");
      fd.set("ville", p.ville || "");
      fd.set("outcome", c.outcome || "");
      fd.set("note", c.note || "");
      fd.set("at", c.at != null ? String(c.at) : "");
      fd.set("rappelAt", c.rappelAt != null ? String(c.rappelAt) : "");
      if (c.audio) {
        try {
          const blob = await (await fetch(c.audio)).blob();
          fd.append("audio", blob, "appel.webm");
          audios++;
        } catch {
          /* audio illisible, on continue */
        }
      }
      try {
        const r: any = await importCall(fd);
        if (!r?.ok) errors++;
      } catch {
        errors++;
      }
      done++;
      setProgress({ done, total: calls.length, audios, errors });
      setStatus(`Import en cours… ${done}/${calls.length}`);
    }

    setStatus(`Terminé : ${done} appel(s) importé(s), ${audios} audio(s), ${errors} erreur(s).`);
    setRunning(false);
    setFinished(true);
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Importer mon ancien CRM
      </h1>
      <p className="mt-2 text-sm text-mut">
        Dépose le fichier <code className="rounded bg-paper px-1">neela-export-complet-….json</code>{" "}
        exporté depuis ton ancien CRM. Les appels et enregistrements seront
        reliés à tes fiches par leur nom.
      </p>

      <label className="mt-6 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-white p-10 text-center hover:border-accent">
        <UploadCloud size={28} className="text-accent" />
        <span className="text-sm font-medium">
          {running ? "Import en cours…" : "Choisir le fichier JSON"}
        </span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          disabled={running}
          className="hidden"
        />
      </label>

      {progress.total > 0 && (
        <div className="mt-6">
          <div className="h-2.5 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-mut">{status}</p>
        </div>
      )}

      {finished && (
        <div className="mt-6 flex gap-3">
          <Link
            href="/crm/journal"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent"
          >
            Voir le journal d'appels →
          </Link>
          <Link
            href="/crm"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:border-ink"
          >
            Tableau de bord
          </Link>
        </div>
      )}

      <p className="mt-8 text-xs text-mut">
        Astuce : tu peux relancer l'import sans risque, les doublons sont évités.
      </p>
    </div>
  );
}
