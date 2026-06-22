"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, SkipForward, Phone, RotateCcw } from "lucide-react";
import type { Prospect } from "@/lib/crm";
import { statutLabel, interetMeta, regionForDept, prospectScore, scoreTier } from "@/lib/crm";
import { telHref } from "@/lib/telephony";
import InteractionForm from "./InteractionForm";
import SmsTemplates from "./SmsTemplates";
import Tag from "./Tag";

// ⚠️ À PERSONNALISER : ton script d'appel par défaut (modifiable en direct).
const DEFAULT_SCRIPT = `Accroche
« Bonjour, [Prénom] de Neela. Je vous appelle car on aide les centres d'audition de votre région à remplir leur agenda avec des patients qualifiés. Vous avez 30 secondes ? »

Qualification
- Comment vous trouvez vos nouveaux patients aujourd'hui ?
- Vous faites déjà de la pub en ligne ?
- Votre agenda est plein ou il reste des créneaux ?

Pitch
« On installe un système clé en main — ciblage local, créations conformes santé, prise de RDV — et on garantit 15 RDV le premier mois, sinon on continue gratuitement. »

Closing
« Je vous propose un échange de 15 min cette semaine pour voir si c'est adapté. Vous préférez mardi ou jeudi ? »`;

export default function CallSession({ queue }: { queue: Prospect[] }) {
  const [items] = useState(() => queue); // file figée pour la durée de la session
  const [i, setI] = useState(0);
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  const next = () => setI((x) => x + 1);
  const prev = () => setI((x) => Math.max(0, x - 1));

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-16 text-center text-sm text-mut">
        Aucun prospect à appeler dans la file. Tout est traité 👌
      </div>
    );
  }

  if (i >= items.length) {
    return (
      <div className="rounded-2xl border border-line bg-white px-4 py-16 text-center">
        <p className="font-display text-xl font-bold">File terminée 🎉</p>
        <p className="mt-1 text-sm text-mut">Tu as parcouru les {items.length} prospects priorisés.</p>
        <button onClick={() => setI(0)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-accent">
          <RotateCcw size={15} /> Reprendre depuis le début
        </button>
      </div>
    );
  }

  const p = items[i];
  const im = interetMeta(p.interet);
  const sc = prospectScore(p);
  const tier = scoreTier(sc);
  const href = telHref(p.telephone);

  return (
    <div>
      {/* Barre de progression / navigation */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Session d'appels</h1>
          <p className="mt-1 text-sm text-mut">Prospect <b className="text-ink">{i + 1}</b> / {items.length} · file priorisée par score</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prev} disabled={i === 0} className="rounded-lg border border-line p-2 text-mut hover:bg-paper disabled:opacity-40" aria-label="Précédent"><ChevronLeft size={17} /></button>
          <button onClick={next} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-mut hover:bg-paper"><SkipForward size={15} /> Passer</button>
          <button onClick={next} className="rounded-lg border border-line p-2 text-mut hover:bg-paper" aria-label="Suivant"><ChevronRight size={17} /></button>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Fiche compacte + saisie */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {im && <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: im.color }}>{im.label}</span>}
              <h2 className="font-display text-xl font-bold tracking-tight">{p.nom}</h2>
              <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-mut">{statutLabel(p.statut)}</span>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: tier.color }} title={tier.label}>score {sc}</span>
            </div>
            <p className="mt-1 text-sm text-mut">{[p.ville, p.departement && `(${p.departement})`, regionForDept(p.departement), p.centre].filter(Boolean).join(" · ")}</p>
            {p.tags && p.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.tags.map((t) => <Tag key={t} label={t} />)}</div>}
            {p.notes && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-paper p-3 text-[13px] text-ink/80">{p.notes}</p>}
            {href ? (
              <a href={href} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-accent">
                <Phone size={16} /> Appeler {p.telephone}
              </a>
            ) : (
              <p className="mt-4 text-sm text-amber-700">Aucun numéro renseigné pour ce prospect.</p>
            )}
            {p.telephone && <div className="mt-4 border-t border-line pt-4"><SmsTemplates phone={p.telephone} nom={p.nom} /></div>}
          </div>

          {/* Enregistre l'appel puis passe au suivant */}
          <InteractionForm prospectId={p.id} prospectName={p.nom} onSaved={next} />
        </div>

        {/* Script */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 font-display text-base font-bold">Script d'appel</h2>
          <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={20}
            className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-accent" />
          <p className="mt-2 text-[11px] text-mut">Modifiable à la volée. (Mémorisé pendant la session.)</p>
        </div>
      </div>
    </div>
  );
}
