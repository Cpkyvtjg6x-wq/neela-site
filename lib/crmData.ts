import { getDb } from "@/lib/supabaseAdmin";
import type { Prospect, Call, Appointment } from "@/lib/crm";
import type { Invoice } from "@/lib/invoices";

// Pagine une requête pour ne jamais plafonner silencieusement à 1000 lignes.
// `make` doit construire une NOUVELLE requête à chaque appel (range est appliqué dessus).
const PAGE = 1000;
async function pageAll<T>(make: () => { range: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }> }): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await make().range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export async function getAllProspects(): Promise<Prospect[]> {
  return pageAll<Prospect>(() => getDb().from("neela_prospects").select("*").order("ville", { ascending: true }));
}

export async function getAllCalls(): Promise<Call[]> {
  return pageAll<Call>(() => getDb().from("neela_calls").select("*").order("created_at", { ascending: false }));
}

export async function getAppointments(): Promise<Appointment[]> {
  return pageAll<Appointment>(() => getDb().from("neela_appointments").select("*").order("start_at", { ascending: true }));
}

export async function getInvoices(): Promise<Invoice[]> {
  return pageAll<Invoice>(() => getDb().from("neela_invoices").select("*").order("year", { ascending: false }).order("seq", { ascending: false }));
}

// Set des prospects déjà contactés — ne charge QUE les prospect_id (et non tous les appels).
export async function getContactedProspectIds(): Promise<Set<string>> {
  const rows = await pageAll<{ prospect_id: string | null }>(() => getDb().from("neela_calls").select("prospect_id"));
  const s = new Set<string>();
  for (const r of rows) if (r.prospect_id) s.add(r.prospect_id);
  return s;
}

// Rappels dont l'échéance est passée/aujourd'hui (requête ciblée pour le dashboard).
export async function getRappels(beforeISO: string): Promise<Call[]> {
  const db = getDb();
  const { data, error } = await db
    .from("neela_calls")
    .select("*")
    .not("rappel_at", "is", null)
    .lte("rappel_at", beforeISO)
    .order("rappel_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Call[];
}

export async function getCallsForProspect(prospectId: string): Promise<Call[]> {
  const db = getDb();
  const { data, error } = await db
    .from("neela_calls").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Call[];
}

// --- Journal d'activité (timeline) ---
export type Activity = {
  id: string;
  prospect_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export async function getProspectActivity(prospectId: string): Promise<Activity[]> {
  const db = getDb();
  const { data, error } = await db
    .from("neela_activity").select("*").eq("prospect_id", prospectId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

// Index pratique id -> prospect (pour relier appels et RDV à leur fiche).
export function indexProspects(prospects: Prospect[]) {
  const map = new Map<string, Prospect>();
  for (const p of prospects) map.set(p.id, p);
  return map;
}
