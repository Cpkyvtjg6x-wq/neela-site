import { getAppointments, getAllCalls, getAllProspects, indexProspects } from "@/lib/crmData";
import Calendar, { type CalEvent } from "@/components/crm/Calendar";
import { addAppointment } from "@/app/crm/actions";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const [appts, calls, prospects] = await Promise.all([
    getAppointments(),
    getAllCalls(),
    getAllProspects(),
  ]);
  const map = indexProspects(prospects);

  const events: CalEvent[] = [];
  for (const a of appts) {
    if (a.status === "annule") continue;
    const p = a.prospect_id ? map.get(a.prospect_id) : null;
    events.push({
      id: a.id,
      date: a.start_at,
      title: a.name || p?.nom || "Rendez-vous",
      type: "rdv",
      href: p ? `/crm/prospect/${p.id}` : undefined,
    });
  }
  for (const c of calls) {
    if (!c.rappel_at) continue;
    const p = map.get(c.prospect_id);
    events.push({
      id: c.id,
      date: c.rappel_at,
      title: `${p?.nom ?? "Prospect"} — rappel`,
      type: "rappel",
      href: p ? `/crm/prospect/${p.id}` : undefined,
    });
  }

  const field =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
  const label = "text-xs font-semibold uppercase tracking-wide text-mut";

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">Agenda</h1>

      <Calendar events={events} />

      <form
        action={addAppointment}
        className="mt-6 rounded-2xl border border-line bg-white p-5"
      >
        <h2 className="mb-4 font-display text-lg font-bold">Ajouter un rendez-vous</h2>
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
        <button
          type="submit"
          className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Ajouter au calendrier
        </button>
      </form>
    </div>
  );
}
