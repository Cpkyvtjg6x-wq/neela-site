"use server";

import { getDb } from "@/lib/supabaseAdmin";

export type ContactState = { ok: boolean; error: string | null };

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("nom") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const centre = String(formData.get("centre") || "").trim();
  const phone = String(formData.get("telephone") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email) return { ok: false, error: "Le nom et l'email sont requis." };

  try {
    const db = getDb();
    await db.from("neela_contact_messages").insert({
      name,
      email,
      phone: phone || null,
      centre: centre || null,
      message: message || null,
    });
    // Crée aussi un prospect dans le CRM (lead entrant)
    await db.from("neela_prospects").insert({
      nom: centre || name,
      email,
      telephone: phone || null,
      notes: message || null,
      source: "entrant",
      statut: "a_appeler",
    });
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error: "Une erreur est survenue. Réessayez, ou écrivez-nous directement.",
    };
  }
}
