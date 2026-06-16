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
  for (const f of ["nom", "centre", "ville", "telephone", "email", "statut", "interet", "notes"]) {
    const v = formData.get(f);
    if (v !== null) patch[f] = String(v) === "" ? null : String(v);
  }
  const db = getDb();
  await db.from("neela_prospects").update(patch).eq("id", id);
  revalidatePath(`/crm/prospect/${id}`);
  revalidatePath("/crm");
  revalidatePath("/crm/prospects");
}

// Enregistre un appel sur la fiche + reporte le statut/intérêt sur le prospect.
export async function addCall(formData: FormData) {
  assertAuth();
  const prospectId = String(formData.get("prospect_id"));
  const outcome = String(formData.get("outcome") || "");
  const notes = String(formData.get("notes") || "");
  const statut = String(formData.get("statut") || "");
  const interet = String(formData.get("interet") || "");
  const rappelRaw = String(formData.get("rappel_at") || "");
  const rappel_at = rappelRaw ? new Date(rappelRaw).toISOString() : null;

  const db = getDb();
  await db.from("neela_calls").insert({
    prospect_id: prospectId,
    outcome: outcome || null,
    notes: notes || null,
    statut: statut || null,
    interet: interet || null,
    rappel_at,
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
