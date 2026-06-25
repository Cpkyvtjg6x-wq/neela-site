"use server";

import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";
import { aiEnabled, transcribeAudio, summarizeCall } from "@/lib/ai";
import {
  adPlannerAiEnabled,
  suggestConfig,
  explainPlan,
  type AdPlannerSuggestInput,
  type AdPlannerSuggestion,
  type AdPlannerPlanInput,
} from "@/lib/aiAdPlanner";

// Transcrit + résume un appel enregistré, puis ajoute le résumé aux notes de l'appel.
export async function summarizeRecording(callId: string): Promise<{ ok: boolean; summary?: string; error?: string }> {
  if (!isAuthed()) return { ok: false, error: "Non autorisé" };
  if (!aiEnabled()) return { ok: false, error: "IA non configurée (OPENAI_API_KEY absent)." };

  const db = getDb();
  const { data: call } = await db
    .from("neela_calls").select("id, prospect_id, recording_path, notes").eq("id", callId).single();
  if (!call?.recording_path) return { ok: false, error: "Aucun enregistrement pour cet appel." };

  const { data: signed } = await db.storage.from("neela-recordings").createSignedUrl(call.recording_path, 600);
  if (!signed?.signedUrl) return { ok: false, error: "Audio indisponible." };

  try {
    const audioRes = await fetch(signed.signedUrl);
    const blob = await audioRes.blob();
    const transcript = await transcribeAudio(blob, "appel.webm");
    const { summary, nextAction } = await summarizeCall(transcript);
    const note = `🤖 Résumé IA : ${summary}${nextAction ? `\nProchaine action : ${nextAction}` : ""}`;
    const merged = call.notes ? `${call.notes}\n\n${note}` : note;
    const { error } = await db.from("neela_calls").update({ notes: merged }).eq("id", callId);
    if (error) return { ok: false, error: error.message };
    if (call.prospect_id) revalidatePath(`/crm/prospect/${call.prospect_id}`);
    return { ok: true, summary };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// --- Ad Planner : couche IA Claude (étape e) ---
// L'IA propose des hypothèses de campagne / explique un plan ; elle n'invente
// jamais de population ou d'audience (cf. garde-fous dans lib/aiAdPlanner.ts).

export async function aiSuggestAdPlannerConfig(
  input: AdPlannerSuggestInput
): Promise<{ ok: boolean; data?: AdPlannerSuggestion; error?: string }> {
  if (!isAuthed()) return { ok: false, error: "Non autorisé" };
  if (!adPlannerAiEnabled()) return { ok: false, error: "IA non configurée (ANTHROPIC_API_KEY absent)." };
  try {
    return { ok: true, data: await suggestConfig(input) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function aiExplainAdPlannerPlan(
  input: AdPlannerPlanInput
): Promise<{ ok: boolean; text?: string; error?: string }> {
  if (!isAuthed()) return { ok: false, error: "Non autorisé" };
  if (!adPlannerAiEnabled()) return { ok: false, error: "IA non configurée (ANTHROPIC_API_KEY absent)." };
  try {
    return { ok: true, text: await explainPlan(input) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
