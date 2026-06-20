"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE, isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";

function assertAuth() {
  if (!isAuthed()) throw new Error("Non autorisé");
}

function parseTags(v: FormDataEntryValue | null): string[] {
  return String(v || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Département français : 2 chiffres (métropole) ou 3 (DOM, ex. 971).
function validDept(v: string): boolean {
  return /^\d{2,3}$/.test(v);
}

// Une saisie <input type="datetime-local"> est une heure « murale » sans fuseau.
// Le serveur (Vercel) tourne en UTC : sans conversion, « 14h30 » serait pris pour 14h30 UTC
// puis réaffiché en heure de Paris (+2h l'été). On interprète donc la saisie comme Europe/Paris.
function localParisToISO(naive: string): string | null {
  if (!naive) return null;
  const asUTC = new Date((naive.length === 16 ? naive + ":00" : naive) + "Z");
  if (isNaN(asUTC.getTime())) return null;
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(asUTC)) p[part.type] = part.value;
  const h = p.hour === "24" ? "00" : p.hour;
  const parisAsUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +h, +p.minute, +p.second);
  const offsetMs = parisAsUTC - asUTC.getTime();
  return new Date(asUTC.getTime() - offsetMs).toISOString();
}

function revalidateCrm(prospectId?: string) {
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
  revalidatePath("/crm/journal");
  if (prospectId) revalidatePath(`/crm/prospect/${prospectId}`);
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/crm/login");
}

// Détail d'un prospect (fiche) : prospect + appels + URLs audio signées.
// Utilisé par la modale de fiche côté client.
export async function getProspectDetail(id: string) {
  assertAuth();
  const db = getDb();
  const { data: prospect } = await db.from("neela_prospects").select("*").eq("id", id).single();
  if (!prospect) return null;
  const { data: callsData } = await db
    .from("neela_calls").select("*").eq("prospect_id", id).order("created_at", { ascending: false });
  const calls = callsData ?? [];
  const audio: Record<string, string> = {};
  for (const c of calls) {
    if (c.recording_path) {
      const { data } = await db.storage.from("neela-recordings").createSignedUrl(c.recording_path, 3600);
      if (data?.signedUrl) audio[c.id] = data.signedUrl;
    }
  }
  return { prospect, calls, audio };
}

// Coordonnées / contexte d'un prospect (tel, email, ville, dept, notes)
export async function updateProspect(formData: FormData) {
  assertAuth();
  const id = String(formData.get("id"));
  const patch: Record<string, unknown> = {};
  for (const f of ["nom", "centre", "ville", "departement", "telephone", "email", "statut", "interet", "notes"]) {
    const v = formData.get(f);
    if (v !== null) patch[f] = String(v) === "" ? null : String(v);
  }
  const tagsRaw = formData.get("tags");
  if (tagsRaw !== null) patch.tags = parseTags(tagsRaw);
  if (typeof patch.departement === "string" && !validDept(patch.departement)) {
    throw new Error("Département invalide : indique 2 ou 3 chiffres (ex. 34, 971).");
  }
  const db = getDb();
  const { error } = await db.from("neela_prospects").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateCrm(id);
}

// Enregistre une interaction : crée un appel ET met à jour le prospect (statut, intérêt, tags)
// => le prospect bascule automatiquement dans le Journal (il a désormais une interaction).
export async function addCall(formData: FormData) {
  assertAuth();
  const prospectId = String(formData.get("prospect_id"));
  const outcome = String(formData.get("outcome") || "");
  const notes = String(formData.get("notes") || "");
  const statut = String(formData.get("statut") || "");
  const interet = String(formData.get("interet") || "");
  const rappelRaw = String(formData.get("rappel_at") || "");
  const rappel_at = localParisToISO(rappelRaw);
  const tags = parseTags(formData.get("tags"));

  // Le statut se déduit automatiquement du résultat de l'appel (plus de case à remplir).
  const STATUT_FROM_OUTCOME: Record<string, string> = {
    a_rappeler: "a_rappeler", r1_pose: "r1_pose", proposition: "proposition",
    signe: "signe", pas_interesse: "pas_interesse",
  };
  const effectiveStatut = statut || STATUT_FROM_OUTCOME[outcome] || (rappel_at ? "a_rappeler" : "");

  const db = getDb();

  let recording_path: string | null = null;
  const audio = formData.get("audio");
  if (audio && audio instanceof File && audio.size > 0) {
    const type = audio.type || "audio/webm";
    const ext = type.includes("mp4") || type.includes("aac") || type.includes("m4a") ? "m4a" : "webm";
    const buf = Buffer.from(await audio.arrayBuffer());
    const path = `${prospectId}/${Date.now()}.${ext}`;
    const { error } = await db.storage
      .from("neela-recordings")
      .upload(path, buf, { contentType: type, upsert: true });
    if (!error) recording_path = path;
  }

  const { error: callErr } = await db.from("neela_calls").insert({
    prospect_id: prospectId,
    outcome: outcome || null,
    notes: notes || null,
    statut: effectiveStatut || null,
    interet: interet || null,
    rappel_at,
    tags,
    recording_path,
  });
  if (callErr) throw new Error(callErr.message);

  const patch: Record<string, unknown> = {};
  if (effectiveStatut) patch.statut = effectiveStatut;
  if (interet) patch.interet = interet;
  if (tags.length) patch.tags = tags;
  if (Object.keys(patch).length) {
    const { error: upErr } = await db.from("neela_prospects").update(patch).eq("id", prospectId);
    if (upErr) throw new Error(upErr.message);
  }

  // Rappel / RDV programmé => on le pose directement dans l'agenda
  if (rappel_at) {
    const rtype = String(formData.get("rappel_type") || "rappel") === "r1" ? "r1" : "rappel";
    const { data: pr } = await db.from("neela_prospects").select("nom").eq("id", prospectId).single();
    // On remplace l'éventuel rappel/RDV d'agenda existant de ce prospect (évite les doublons).
    await db.from("neela_appointments").delete().eq("prospect_id", prospectId).in("source", ["rappel", "r1"]);
    const { error: apptErr } = await db.from("neela_appointments").insert({
      prospect_id: prospectId,
      start_at: rappel_at,
      name: pr?.nom ?? null,
      status: "reserve",
      source: rtype,
    });
    if (apptErr) throw new Error(apptErr.message);
    revalidatePath("/crm/agenda");
  }

  revalidateCrm(prospectId);
}

// Crée un nouveau prospect puis ouvre sa fiche
export async function addProspect(
  formData: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  assertAuth();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return { ok: false, error: "Le nom est obligatoire." };
  const departement = String(formData.get("departement") || "").trim();
  if (departement && !validDept(departement)) {
    return { ok: false, error: "Département invalide : indique 2 ou 3 chiffres (ex. 34, 971)." };
  }
  const db = getDb();
  // Anti-doublon : un prospect du même nom existe-t-il déjà ?
  const { data: existing } = await db.from("neela_prospects").select("id").ilike("nom", nom).limit(1);
  if (existing && existing.length) {
    return { ok: false, error: `Un prospect nommé « ${nom} » existe déjà. Ouvre sa fiche ou choisis un autre nom.` };
  }
  const row = {
    nom,
    centre: String(formData.get("centre") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    departement: departement || null,
    telephone: String(formData.get("telephone") || "") || null,
    email: String(formData.get("email") || "") || null,
    interet: String(formData.get("interet") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    source: "sortant",
    statut: "a_appeler",
  };
  const { data, error } = await db.from("neela_prospects").insert(row).select("id").single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
  return { ok: true, id: data?.id };
}

// Rendez-vous (agenda)
export async function addAppointment(formData: FormData) {
  assertAuth();
  const startRaw = String(formData.get("start_at") || "");
  if (!startRaw) return;
  const prospectId = String(formData.get("prospect_id") || "") || null;
  const db = getDb();
  const start_at = localParisToISO(startRaw);
  if (!start_at) throw new Error("Date/heure du rendez-vous invalide.");
  const { error } = await db.from("neela_appointments").insert({
    start_at,
    name: String(formData.get("name") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    message: String(formData.get("message") || "") || null,
    prospect_id: prospectId,
    status: "reserve",
    source: "manuel",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/crm/agenda");
  revalidatePath("/crm");
}

export async function updateAppointmentStatus(formData: FormData) {
  assertAuth();
  const id = String(formData.get("id"));
  const status = String(formData.get("status") || "reserve");
  const db = getDb();
  const { error } = await db.from("neela_appointments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/crm/agenda");
  revalidatePath("/crm");
}

// Marque un rappel comme traité : efface la date de rappel de l'appel
// et retire l'éventuel rendez-vous « rappel » de l'agenda pour ce prospect.
export async function clearRappel(formData: FormData) {
  assertAuth();
  const callId = String(formData.get("call_id"));
  const prospectId = String(formData.get("prospect_id") || "");
  const db = getDb();
  const { error } = await db.from("neela_calls").update({ rappel_at: null }).eq("id", callId);
  if (error) throw new Error(error.message);
  if (prospectId) {
    await db.from("neela_appointments").delete().eq("prospect_id", prospectId).eq("source", "rappel");
  }
  revalidateCrm(prospectId || undefined);
  revalidatePath("/crm/agenda");
}

// Import d'un appel depuis l'ancien CRM (relié au prospect par son nom)
export async function importCall(formData: FormData) {
  assertAuth();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return { ok: false, reason: "no-nom" };
  const ville = String(formData.get("ville") || "") || null;
  const outcome = String(formData.get("outcome") || "") || null;
  const note = String(formData.get("note") || "") || null;
  const atRaw = String(formData.get("at") || "");
  const rappelRaw = String(formData.get("rappelAt") || "");

  const parseDate = (v: string): string | null => {
    if (!v) return null;
    const n = Number(v);
    const d = new Date(isNaN(n) ? v : n);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const created_at = parseDate(atRaw) ?? new Date().toISOString();
  const rappel_at = parseDate(rappelRaw);

  const db = getDb();
  const { data: found } = await db.from("neela_prospects").select("id").ilike("nom", nom).limit(1);
  let prospectId = found?.[0]?.id as string | undefined;
  if (!prospectId) {
    const { data: created } = await db
      .from("neela_prospects")
      .insert({ nom, ville, source: "sortant", statut: "a_appeler" })
      .select("id")
      .single();
    prospectId = created?.id;
  }
  if (!prospectId) return { ok: false, reason: "no-prospect" };

  const { data: dup } = await db
    .from("neela_calls")
    .select("id")
    .eq("prospect_id", prospectId)
    .eq("created_at", created_at)
    .limit(1);
  if (dup && dup.length) return { ok: true, dup: true };

  let recording_path: string | null = null;
  const audio = formData.get("audio");
  if (audio && audio instanceof File && audio.size > 0) {
    const buf = Buffer.from(await audio.arrayBuffer());
    const path = `${prospectId}/${Number(atRaw) || Date.now()}.webm`;
    const { error } = await db.storage
      .from("neela-recordings")
      .upload(path, buf, { contentType: "audio/webm", upsert: true });
    if (!error) recording_path = path;
  }

  await db.from("neela_calls").insert({
    prospect_id: prospectId,
    outcome,
    notes: note,
    created_at,
    rappel_at,
    recording_path,
    tags: [],
  });

  revalidateCrm(prospectId);
  return { ok: true };
}
