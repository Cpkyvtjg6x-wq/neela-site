import { getAppointments, getAllProspects, indexProspects } from "@/lib/crmData";
import AgendaTabs from "@/components/crm/AgendaTabs";
import type { AgendaItem } from "@/components/crm/AgendaView";
import { addAppointment } from "@/app/crm/actions";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [appts, prospects] = await Promise.all([getAppointments(), getAllProspects()]);
  const map = indexProspects(prospects);

  const items: AgendaItem[] = appts
    .filter((a) => a.status !== "annule")
    .map((a) => {
      const p = a.prospect_id ? map.get(a.prospect_id) ?? null : null;
      const isRappel = a.source === "rappel";
      return {
        id: a.id,
        start: a.start_at,
        end: a.end_at,
        title: a.name || p?.nom || "Rendez-vous",
        type: isRappel ? ("rappel" as const) : ("rdv" as const),
        status: a.status,
        prospect: p,
        phone: a.phone || p?.telephone || null,
      };
    });

  const nowISO = new Date().toISOString();

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">Agenda</h1>

      <AgendaTabs items={items} nowISO={nowISO} />

      <details className="mt-6 rounded-2xl border border-line bg-white p-5">
        <summary className="cursor-pointer font-display text-lg font-bold">Ajouter un rendez-vous</summary>
        <form action={addAppointment} className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className={label}>Date &amp; heure *</p>
              <input type="datetime-local" name="start_at" required className={field} />
            </div>
            <div>
              <p className={label}>Nom / centre</p>
              <input name="name" className={field} />
            </div>
            <div>
              <p className={label}>Téléphone</p>
              <input name="phone" className={field} />
            </div>
            <div>
              <p className={label}>Email</p>
              <input name="email" type="email" className={field} />
            </div>
            <div className="sm:col-span-2">
              <p className={label}>Note</p>
              <input name="message" className={field} />
            </div>
          </div>
          <button type="submit" className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Ajouter au calendrier
          </button>
        </form>
      </details>
    </div>
  );
}
