"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AUTH_COOKIE, isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";
import { STATUTS, INTERETS } from "@/lib/crm";
import { computeTotals, type InvoiceInput } from "@/lib/invoices";

const STATUT_KEYS = new Set(STATUTS.map((s) => s.key));
const INTERET_KEYS = new Set(INTERETS.map((s) => s.key));
const VERIF_KEYS = new Set(["ok", "doute"]);

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

// Email : validation souple (présence d'un @ et d'un domaine plausible).
function validEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Téléphone : on accepte espaces, points, tirets, parenthèses et +.
// On exige seulement un nombre de chiffres plausible (10 en France, jusqu'à 15 à l'international).
function validPhone(v: string): boolean {
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
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

// Journal d'audit léger — best-effort : ne doit jamais casser l'action principale.
async function logActivity(
  db: ReturnType<typeof getDb>,
  prospectId: string | null,
  type: string,
  payload: Record<string, unknown> = {}
) {
  if (!prospectId) return;
  try {
    await db.from("neela_activity").insert({ prospect_id: prospectId, type, payload });
  } catch {
    /* l'audit est secondaire */
  }
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
  // URLs audio signées en UNE seule requête groupée (au lieu d'une par appel = lent).
  const recCalls = calls.filter((c) => c.recording_path);
  const audio: Record<string, string> = {};
  if (recCalls.length) {
    const { data: signedList } = await db.storage
      .from("neela-recordings")
      .createSignedUrls(recCalls.map((c) => c.recording_path as string), 3600);
    (signedList ?? []).forEach((s, i) => {
      if (s.signedUrl) audio[recCalls[i].id] = s.signedUrl;
    });
  }
  return { prospect, calls, audio };
}

// Coordonnées / contexte d'un prospect (tel, email, ville, dept, notes)
export async function updateProspect(formData: FormData) {
  assertAuth();
  const id = String(formData.get("id"));
  const patch: Record<string, unknown> = {};
  for (const f of ["nom", "centre", "ville", "departement", "telephone", "email", "statut", "interet", "verif", "notes"]) {
    const v = formData.get(f);
    if (v !== null) patch[f] = String(v) === "" ? null : String(v);
  }
  const tagsRaw = formData.get("tags");
  if (tagsRaw !== null) patch.tags = parseTags(tagsRaw);
  if (typeof patch.departement === "string" && !validDept(patch.departement)) {
    throw new Error("Département invalide : indique 2 ou 3 chiffres (ex. 34, 971).");
  }
  if (typeof patch.statut === "string" && !STATUT_KEYS.has(patch.statut)) throw new Error("Statut invalide.");
  if (typeof patch.interet === "string" && !INTERET_KEYS.has(patch.interet)) throw new Error("Intérêt invalide.");
  if (typeof patch.verif === "string" && !VERIF_KEYS.has(patch.verif)) throw new Error("Valeur de vérification invalide.");
  if (typeof patch.email === "string" && !validEmail(patch.email)) throw new Error("Email invalide.");
  if (typeof patch.telephone === "string" && !validPhone(patch.telephone)) {
    throw new Error("Téléphone invalide : indique un numéro à 10 chiffres (ex. 06 12 34 56 78).");
  }
  const db = getDb();
  let prevStatut: string | null = null;
  if (typeof patch.statut === "string") {
    const { data: prev } = await db.from("neela_prospects").select("statut").eq("id", id).single();
    prevStatut = prev?.statut ?? null;
  }
  const { error } = await db.from("neela_prospects").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  if (typeof patch.statut === "string" && patch.statut !== prevStatut) {
    await logActivity(db, id, "statut", { from: prevStatut, to: patch.statut });
  }
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
    await logActivity(db, prospectId, rtype === "r1" ? "r1" : "rappel", { at: rappel_at });
    revalidatePath("/crm/agenda");
  }

  await logActivity(db, prospectId, "call", {
    outcome: outcome || null,
    statut: effectiveStatut || null,
    interet: interet || null,
    hasAudio: !!recording_path,
    note: notes ? notes.slice(0, 280) : null,
  });

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
  const emailRaw = String(formData.get("email") || "").trim();
  if (emailRaw && !validEmail(emailRaw)) {
    return { ok: false, error: "Email invalide." };
  }
  const telRaw = String(formData.get("telephone") || "").trim();
  if (telRaw && !validPhone(telRaw)) {
    return { ok: false, error: "Téléphone invalide : indique un numéro à 10 chiffres (ex. 06 12 34 56 78)." };
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
  const apptEmail = String(formData.get("email") || "").trim();
  if (apptEmail && !validEmail(apptEmail)) throw new Error("Email invalide.");
  const apptPhone = String(formData.get("phone") || "").trim();
  if (apptPhone && !validPhone(apptPhone)) {
    throw new Error("Téléphone invalide : indique un numéro à 10 chiffres (ex. 06 12 34 56 78).");
  }
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
  await logActivity(db, prospectId, "rdv", { at: start_at, name: String(formData.get("name") || "") || null });
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
    await db.from("neela_appointments").delete().eq("prospect_id", prospectId).in("source", ["rappel", "r1"]);
  }
  revalidateCrm(prospectId || undefined);
  revalidatePath("/crm/agenda");
}

// --- Édition / suppression (Lot A) ---

// Corrige un appel mal saisi (résultat, notes, intérêt, tags, rappel) + re-synchronise l'agenda.
export async function updateCall(formData: FormData) {
  assertAuth();
  const db = getDb();
  const callId = String(formData.get("call_id"));
  if (!callId) throw new Error("Appel introuvable.");
  const { data: call } = await db.from("neela_calls").select("prospect_id").eq("id", callId).single();
  const prospectId = (call?.prospect_id as string) || String(formData.get("prospect_id") || "");

  const outcome = String(formData.get("outcome") || "");
  const notes = String(formData.get("notes") || "");
  const interet = String(formData.get("interet") || "");
  const tags = parseTags(formData.get("tags"));
  const rappel_at = localParisToISO(String(formData.get("rappel_at") || ""));
  if (interet && !INTERET_KEYS.has(interet)) throw new Error("Intérêt invalide.");

  const { error } = await db.from("neela_calls").update({
    outcome: outcome || null,
    notes: notes || null,
    interet: interet || null,
    tags,
    rappel_at,
  }).eq("id", callId);
  if (error) throw new Error(error.message);

  if (prospectId) {
    await db.from("neela_appointments").delete().eq("prospect_id", prospectId).in("source", ["rappel", "r1"]);
    if (rappel_at) {
      const rtype = String(formData.get("rappel_type") || "rappel") === "r1" ? "r1" : "rappel";
      const { data: pr } = await db.from("neela_prospects").select("nom").eq("id", prospectId).single();
      await db.from("neela_appointments").insert({ prospect_id: prospectId, start_at: rappel_at, name: pr?.nom ?? null, status: "reserve", source: rtype });
    }
    await logActivity(db, prospectId, "call_edit", { call_id: callId, outcome: outcome || null });
  }
  revalidateCrm(prospectId || undefined);
  revalidatePath("/crm/agenda");
}

// Supprime un appel (et son audio + rappel d'agenda éventuel).
export async function deleteCall(formData: FormData) {
  assertAuth();
  const db = getDb();
  const callId = String(formData.get("call_id"));
  if (!callId) throw new Error("Appel introuvable.");
  const { data: call } = await db.from("neela_calls").select("prospect_id, recording_path, rappel_at").eq("id", callId).single();
  const prospectId = (call?.prospect_id as string) || null;
  if (call?.recording_path) {
    await db.storage.from("neela-recordings").remove([call.recording_path as string]);
  }
  const { error } = await db.from("neela_calls").delete().eq("id", callId);
  if (error) throw new Error(error.message);
  if (prospectId && call?.rappel_at) {
    await db.from("neela_appointments").delete().eq("prospect_id", prospectId).in("source", ["rappel", "r1"]);
  }
  await logActivity(db, prospectId, "call_delete", { call_id: callId });
  revalidateCrm(prospectId || undefined);
  revalidatePath("/crm/agenda");
}

// Supprime un prospect et tout ce qui en dépend (FK sans cascade : on nettoie à la main).
export async function deleteProspect(formData: FormData) {
  assertAuth();
  const db = getDb();
  const id = String(formData.get("id"));
  if (!id) throw new Error("Prospect introuvable.");

  const { data: calls } = await db.from("neela_calls").select("recording_path").eq("prospect_id", id);
  const paths = (calls ?? []).map((c) => c.recording_path).filter(Boolean) as string[];
  if (paths.length) await db.storage.from("neela-recordings").remove(paths);

  await db.from("neela_invoices").update({ prospect_id: null }).eq("prospect_id", id);
  await db.from("neela_contact_messages").update({ prospect_id: null }).eq("prospect_id", id);
  await db.from("neela_appointments").delete().eq("prospect_id", id);
  await db.from("neela_calls").delete().eq("prospect_id", id);
  const { error } = await db.from("neela_prospects").delete().eq("id", id); // neela_activity en cascade
  if (error) throw new Error(error.message);

  revalidateCrm();
  revalidatePath("/crm/agenda");
  redirect("/crm/prospects");
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
  if (dup && dup.length) return { ok: true, dup: true, id: prospectId };

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
  return { ok: true, id: prospectId };
}

// --- Factures ---
export async function saveInvoice(
  input: InvoiceInput
): Promise<{ ok: boolean; id?: string; number?: string; error?: string }> {
  assertAuth();
  const db = getDb();
  const t = computeTotals(input);

  const base = {
    doc_type: input.doc_type === "devis" ? "devis" : "facture",
    valid_until: input.valid_until || null,
    status: input.status || "brouillon",
    issue_date: input.issue_date,
    due_date: input.due_date || null,
    sale_date: input.sale_date || null,
    prospect_id: input.prospect_id || null,
    client: input.client,
    emitter: input.emitter,
    items: input.items,
    vat_enabled: !!input.vat_enabled,
    vat_rate: Number(input.vat_rate) || 20,
    discount_type: input.discount_type,
    discount_value: Number(input.discount_value) || 0,
    deposit: Number(input.deposit) || 0,
    notes: input.notes || null,
    payment_terms: input.payment_terms || null,
    total_ht: Math.round(t.ht * 100) / 100,
    total_tva: Math.round(t.tva * 100) / 100,
    total_ttc: Math.round(t.ttc * 100) / 100,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await db.from("neela_invoices").update(base).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/crm/factures");
    return { ok: true, id: input.id };
  }

  // Numérotation séquentielle par année ET type (devis : D2026-001, facture : 2026-001).
  // Plancher de reprise pour les FACTURES : la numérotation démarre au minimum à ce numéro
  // pour l'année (reprise d'une séquence déjà entamée hors CRM). Sans effet une fois dépassé.
  const FACTURE_SEQ_FLOOR: Record<number, number> = { 2026: 30 };
  const docType = base.doc_type;
  const year = new Date((input.issue_date || new Date().toISOString().slice(0, 10)) + "T12:00:00Z").getUTCFullYear();
  const { data: last } = await db
    .from("neela_invoices").select("seq").eq("year", year).eq("doc_type", docType).order("seq", { ascending: false }).limit(1);
  const floor = docType === "facture" ? (FACTURE_SEQ_FLOOR[year] ?? 1) : 1;
  const seq = Math.max(((last?.[0]?.seq as number) ?? 0) + 1, floor);
  const number = `${docType === "devis" ? "D" : ""}${year}-${String(seq).padStart(3, "0")}`;

  const { data, error } = await db
    .from("neela_invoices")
    .insert({ ...base, year, seq, number })
    .select("id, number")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/crm/factures");
  return { ok: true, id: data?.id, number: data?.number };
}

// Duplique une facture/un devis (ex. pour le mois suivant) ou convertit un devis en facture.
function shiftISO(iso: string, months: number, days: number): string {
  const d = new Date((iso || new Date().toISOString().slice(0, 10)) + "T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function copyInvoice(id: string, opts: { toInvoice?: boolean; nextMonth?: boolean }) {
  assertAuth();
  const db = getDb();
  const { data: src } = await db.from("neela_invoices").select("*").eq("id", id).single();
  if (!src) return { ok: false, error: "Introuvable" };

  const toFacture = opts.toInvoice && src.doc_type === "devis";
  const m = opts.nextMonth ? 1 : 0;
  const today = new Date().toISOString().slice(0, 10);

  const input: InvoiceInput = {
    doc_type: toFacture ? "facture" : (src.doc_type as "facture" | "devis"),
    valid_until: src.valid_until ? shiftISO(src.valid_until, m, 0) : null,
    status: "brouillon",
    issue_date: opts.nextMonth ? shiftISO(src.issue_date, 1, 0) : today,
    due_date: toFacture ? shiftISO(today, 0, 30) : (src.due_date ? shiftISO(src.due_date, m, 0) : null),
    sale_date: null,
    prospect_id: src.prospect_id ?? null,
    client: src.client,
    emitter: src.emitter,
    items: src.items,
    vat_enabled: src.vat_enabled,
    vat_rate: src.vat_rate,
    discount_type: src.discount_type,
    discount_value: src.discount_value,
    deposit: 0,
    notes: src.notes,
    payment_terms: src.payment_terms,
  };
  return saveInvoice(input);
}

export async function duplicateInvoiceNextMonth(id: string) {
  return copyInvoice(id, { nextMonth: true });
}
export async function convertDevisToInvoice(id: string) {
  return copyInvoice(id, { toInvoice: true });
}

export async function setInvoiceStatus(id: string, status: string) {
  assertAuth();
  const db = getDb();
  const { error } = await db.from("neela_invoices").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/crm/factures");
}

export async function deleteInvoice(id: string) {
  assertAuth();
  const db = getDb();
  const { error } = await db.from("neela_invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/crm/factures");
}
