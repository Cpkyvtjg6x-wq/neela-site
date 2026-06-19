"use client";

import { useMemo, useState } from "react";
import type { Prospect } from "@/lib/crm";
import { statutLabel, interetMeta, regionForDept, REGIONS, STATUTS, INTERETS, prospectScore, scoreTier } from "@/lib/crm";
import { useFiche } from "./FicheModal";

export default function ProspectList({ prospects }: { prospects: Prospect[] }) {
  const { open } = useFiche();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [region, setRegion] = useState("");
  const [interet, setInteret] = useState("");
  const [statut, setStatut] = useState("");
  const [groupBy, setGroupBy] = useState<"" | "region" | "departement" | "ville">("region");
  const [sortBy, setSortBy] = useState<"priorite" | "nom" | "recent">("priorite");

  const depts = useMemo(
    () =>
      [...new Set(prospects.map((p) => p.departement).filter(Boolean))].sort() as string[],
    [prospects]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const arr = prospects.filter((p) => {
      if (dept && p.departement !== dept) return false;
      if (region && regionForDept(p.departement) !== region) return false;
      if (interet && p.interet !== interet) return false;
      if (statut && p.statut !== statut) return false;
      if (needle) {
        const hay = `${p.nom ?? ""} ${p.centre ?? ""} ${p.ville ?? ""} ${p.notes ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      if (sortBy === "nom") return (a.nom ?? "").localeCompare(b.nom ?? "");
      if (sortBy === "recent") return +new Date(b.created_at) - +new Date(a.created_at);
      return prospectScore(b) - prospectScore(a);
    });
    return arr;
  }, [prospects, q, dept, region, interet, statut, sortBy]);

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: "", items: filtered }];
    const m = new Map<string, Prospect[]>();
    for (const p of filtered) {
      const k =
        groupBy === "region"
          ? regionForDept(p.departement)
          : (p[groupBy] as string) || "—";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, items]) => ({ key, items }));
  }, [filtered, groupBy]);

  const inputCls =
    "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, ville, notes…)"
          className={`${inputCls} min-w-[200px] flex-1`}
        />
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputCls}>
          <option value="">Toutes régions</option>
          {Object.keys(REGIONS).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls}>
          <option value="">Tous dépts</option>
          {depts.map((d) => (
            <option key={d} value={d}>
              Dépt {d}
            </option>
          ))}
        </select>
        <select value={interet} onChange={(e) => setInteret(e.target.value)} className={inputCls}>
          <option value="">Intérêt</option>
          {INTERETS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className={inputCls}>
          <option value="">Statut</option>
          {STATUTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "priorite" | "nom" | "recent")}
          className={inputCls}
        >
          <option value="priorite">Tri : priorité</option>
          <option value="nom">Tri : nom A→Z</option>
          <option value="recent">Tri : récents</option>
        </select>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "" | "region" | "departement" | "ville")}
          className={inputCls}
        >
          <option value="">Sans groupe</option>
          <option value="region">Par région</option>
          <option value="departement">Par département</option>
          <option value="ville">Par ville</option>
        </select>
      </div>

      <p className="mb-3 text-xs text-mut">{filtered.length} résultat(s)</p>

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.key}>
            {g.key && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-accent/10 px-4 py-2.5">
                <span className="font-display text-sm font-bold text-accent">
                  {groupBy === "departement" ? `Département ${g.key}` : g.key}
                </span>
                <span className="text-xs font-semibold text-accent/70">
                  {g.items.length} centre{g.items.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {g.items.map((p, i) => {
                const im = interetMeta(p.interet);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => open(p.id)}
                    className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-paper ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: im?.color ?? "#cbd5e1" }}
                      title={im?.label ?? "—"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{p.nom}</p>
                      <p className="truncate text-[13px] text-mut">
                        {p.ville} ({p.departement}) · {p.centre}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-[13px] font-medium text-ink">{p.telephone || "—"}</p>
                      <p className="text-[12px] text-mut">{statutLabel(p.statut)}</p>
                    </div>
                    {(() => {
                      const sc = prospectScore(p);
                      const t = scoreTier(sc);
                      return (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                          style={{ background: t.color }}
                          title={t.label}
                        >
                          {sc}
                        </span>
                      );
                    })()}
                    {p.verif === "doute" && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        à vérifier
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-mut">
            Aucun prospect ne correspond.
          </p>
        )}
      </div>
    </div>
  );
}
