import { getDb } from "@/lib/supabaseAdmin";
import type { Prospect, Call, Appointment } from "@/lib/crm";

export async function getAllProspects(): Promise<Prospect[]> {
  const db = getDb();
  const { data } = await db
    .from("neela_prospects")
    .select("*")
    .order("ville", { ascending: true });
  return (data ?? []) as Prospect[];
}

export async function getAllCalls(): Promise<Call[]> {
  const db = getDb();
  const { data } = await db
    .from("neela_calls")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Call[];
}

export async function getAppointments(): Promise<Appointment[]> {
  const db = getDb();
  const { data } = await db
    .from("neela_appointments")
    .select("*")
    .order("start_at", { ascending: true });
  return (data ?? []) as Appointment[];
}

// Index pratique id -> prospect (pour relier appels et RDV à leur fiche).
export function indexProspects(prospects: Prospect[]) {
  const map = new Map<string, Prospect>();
  for (const p of prospects) map.set(p.id, p);
  return map;
}
