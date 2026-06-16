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
}
