"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prospect } from "@/lib/crm";
import { statutLabel, interetMeta } from "@/lib/crm";

export default function ProspectList({ prospects }: { prospects: Prospect[] }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [interet, setInteret] = useState("");
  const [statut, setStatut] = useState("");

  const depts = useMemo(
    () =>
      [...new Set(prospects.map((p) => p.departement).filter(Boolean))].sort() as string[],
    [prospects]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return prospects.filter((p) => {
      if (dept && p.departement !== dept) return false;
      if (interet && p.interet !== interet) return false;
      if (statut && p.statut !== statut) return false;
      if (needle) {
        const hay = `${p.nom ?? ""} ${p.centre ?? ""} ${p.ville ?? ""} ${p.notes ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [prospects, q, dept, interet, statut]);

  const inputCls =
    "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div>
      {/* Filtres */}
      <div className="mb-5 flex flex-wrap gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, ville, notes…)"
          className={`${inputCls} min-w-[220px] flex-1`}
        />
        <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls}>
          <option value="">Tous départements</option>
          {depts.map((d) => (
            <option key={d} value={d}>
              Dépt {d}
            </option>
          ))}
        </select>
        <select value={interet} onChange={(e) => setInteret(e.target.value)} className={inputCls}>
          <option value="">Tout intérêt</option>
          <option value="chaud">Chaud</option>
          <option value="tiede">Tiède</option>
          <option value="froid">Froid</option>
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className={inputCls}>
          <option value="">Tout statut</option>
          <option value="a_appeler">À appeler</option>
          <option value="a_rappeler">À rappeler</option>
          <option value="r1_pose">R1 posé</option>
          <option value="proposition">Proposition</option>
          <option value="signe">Signé</option>
          <option value="pas_interesse">Pas intéressé</option>
        </select>
      </div>

      <p className="mb-3 text-xs text-mut">{filtered.length} résultat(s)</p>

      {/* Liste */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {filtered.map((p, i) => {
          const im = interetMeta(p.interet);
          return (
            <Link
              key={p.id}
              href={`/crm/prospect/${p.id}`}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-paper ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: im?.color ?? "#cbd5e1" }}
                title={im?.label ?? "—"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">
                  {p.nom}
                </p>
                <p className="truncate text-[13px] text-mut">
                  {p.ville} ({p.departement}) · {p.centre}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-[13px] font-medium text-ink">
                  {p.telephone || "—"}
                </p>
                <p className="text-[12px] text-mut">{statutLabel(p.statut)}</p>
              </div>
              {p.verif === "doute" && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  à vérifier
                </span>
              )}
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-mut">
            Aucun prospect ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}
