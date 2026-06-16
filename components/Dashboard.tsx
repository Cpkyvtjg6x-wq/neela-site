"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/site";
import Counter from "./Counter";

const BARS = [38, 52, 46, 68, 60, 82, 74, 100];

/** Maquette d'un tableau de bord de résultats, avec compteurs et graphique animés. */
export default function Dashboard() {
  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <p className="font-display text-[15px] font-bold">
          Campagne — 30 derniers jours
        </p>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">
          ● En cours
        </span>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { v: 23, s: "", l: "RDV obtenus" },
          { v: 14, s: "€", l: "Coût / RDV" },
          { v: 92, s: "%", l: "Présence" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl bg-paper p-4">
            <p className="font-display text-2xl font-bold">
              <Counter to={k.v} suffix={k.s} />
            </p>
            <p className="mt-1 text-[11px] font-medium text-mut">{k.l}</p>
          </div>
        ))}
      </div>

      {/* Graphique en barres */}
      <div className="flex h-[120px] items-end gap-2 border-t border-line pt-4">
        {BARS.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 origin-bottom rounded-t-md bg-gradient-to-t from-accent to-[#5AA0FF]"
            style={{ height: `${h}%` }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.07 }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {["il y a 2 h", "aujourd'hui"].map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2.5 text-[12.5px]"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">Nouveau RDV — Bilan auditif</span>
            <span className="ml-auto text-[11px] text-mut">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
