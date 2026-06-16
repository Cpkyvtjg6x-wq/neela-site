"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE, isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";

function assertAuth() {
  if (!isAuthed()) throw new Error("Non autorisé");
}

export async function logout() {
  cookies().delete(AUTH_COOKIE);
  redirect("/crm/login");
}

// Met à jour des champs d'un prospect (statut, intérêt, notes, coordonnées…).
export async function updateProspect(formData: FormData) {
  assertAuth();
  const id = String(formData.get("id"));
  const patch: Record<string, unknown> = {};
  for (const f of ["nom", "centre", "ville", "departement", "telephone", "email", "statut", "interet", "notes"]) {
    const v = formData.get(f);
    if (v !== null) patch[f] = String(v) === "" ? null : String(v);
  }
  const tagsRaw = formData.get("tags");
  if (tagsRaw !== null) {
    patch.tags = String(tagsRaw)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  const db = getDb();
  await db.from("neela_prospects").update(patch).eq("id", id);
  revalidatePath(`/crm/prospect/${id}`);
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
}

// Enregistre un appel sur la fiche (+ tags + audio) et reporte le statut/intérêt.
export async function addCall(formData: FormData) {
  assertAuth();
  const prospectId = String(formData.get("prospect_id"));
  const outcome = String(formData.get("outcome") || "");
  const notes = String(formData.get("notes") || "");
  const statut = String(formData.get("statut") || "");
  const interet = String(formData.get("interet") || "");
  const rappelRaw = String(formData.get("rappel_at") || "");
  const rappel_at = rappelRaw ? new Date(rappelRaw).toISOString() : null;

  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const db = getDb();

  // Upload de l'enregistrement audio s'il y en a un
  let recording_path: string | null = null;
  const audio = formData.get("audio");
  if (audio && audio instanceof File && audio.size > 0) {
    const buf = Buffer.from(await audio.arrayBuffer());
    const path = `${prospectId}/${Date.now()}.webm`;
    const { error } = await db.storage
      .from("neela-recordings")
      .upload(path, buf, { contentType: audio.type || "audio/webm", upsert: false });
    if (!error) recording_path = path;
  }

  await db.from("neela_calls").insert({
    prospect_id: prospectId,
    outcome: outcome || null,
    notes: notes || null,
    statut: statut || null,
    interet: interet || null,
    rappel_at,
    tags,
    recording_path,
  });

  // Reporter sur le prospect ce qui a changé
  const patch: Record<string, unknown> = {};
  if (statut) patch.statut = statut;
  if (interet) patch.interet = interet;
  if (Object.keys(patch).length) {
    await db.from("neela_prospects").update(patch).eq("id", prospectId);
  }

  revalidatePath(`/crm/prospect/${prospectId}`);
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
  revalidatePath("/crm/journal");
}

// Crée un nouveau prospect puis ouvre sa fiche.
export async function addProspect(formData: FormData) {
  assertAuth();
  const row: Record<string, unknown> = {
    nom: String(formData.get("nom") || "") || null,
    centre: String(formData.get("centre") || "") || null,
    ville: String(formData.get("ville") || "") || null,
    departement: String(formData.get("departement") || "") || null,
    telephone: String(formData.get("telephone") || "") || null,
    email: String(formData.get("email") || "") || null,
    interet: String(formData.get("interet") || "") || null,
    notes: String(formData.get("notes") || "") || null,
    source: "sortant",
    statut: "a_appeler",
  };
  const db = getDb();
  const { data } = await db
    .from("neela_prospects")
    .insert(row)
    .select("id")
    .single();
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
  if (data?.id) redirect(`/crm/prospect/${data.id}`);
  redirect("/crm/prospects");
}

// Crée un rendez-vous (agenda).
export async function addAppointment(formData: FormData) {
  assertAuth();
  const startRaw = String(formData.get("start_at") || "");
  if (!startRaw) return;
  const prospectId = String(formData.get("prospect_id") || "") || null;
  const db = getDb();
  await db.from("neela_appointments").insert({
    start_at: new Date(startRaw).toISOString(),
    name: String(formData.get("name") || "") || null,
    phone: String(formData.get("phone") || "") || null,
    email: String(formData.get("email") || "") || null,
    message: String(formData.get("message") || "") || null,
    prospect_id: prospectId,
    status: "reserve",
    source: "manuel",
  });
  revalidatePath("/crm/agenda");
  revalidatePath("/crm");
}

// Import d'un appel depuis l'ancien CRM (relié au prospect par son nom).
export async function importCall(formData: FormData) {
  assertAuth();
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return { ok: false, reason: "no-nom" };
  const ville = String(formData.get("ville") || "") || null;
  const outcome = String(formData.get("outcome") || "") || null;
  const note = String(formData.get("note") || "") || null;
  const atRaw = String(formData.get("at") || "");
  const rappelRaw = String(formData.get("rappelAt") || "");

  const parseDate = (v: string) => {
    if (!v) return null;
    const n = Number(v);
    const d = new Date(isNaN(n) ? v : n);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const created_at = parseDate(atRaw) ?? new Date().toISOString();
  const rappel_at = parseDate(rappelRaw);

  const db = getDb();

  // Retrouver le prospect par son nom (sinon le créer)
  const { data: found } = await db
    .from("neela_prospects")
    .select("id")
    .ilike("nom", nom)
    .limit(1);
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

  // Éviter les doublons si l'import est relancé
  const { data: dup } = await db
    .from("neela_calls")
    .select("id")
    .eq("prospect_id", prospectId)
    .eq("created_at", created_at)
    .limit(1);
  if (dup && dup.length) return { ok: true, dup: true };

  // Upload de l'audio s'il y en a un
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

  revalidatePath("/crm");
  revalidatePath("/crm/journal");
  revalidatePath(`/crm/prospect/${prospectId}`);
  return { ok: true };
}

// Met à jour le statut d'un rendez-vous (honoré / annulé / no-show).
export async function updateAppointmentStatus(formData: FormData) {
  assertAuth();
  const id = String(formData.get("id"));
  const status = String(formData.get("status") || "reserve");
  const db = getDb();
  await db.from("neela_appointments").update({ status }).eq("id", id);
  revalidatePath("/crm/agenda");
  revalidatePath("/crm");
}
