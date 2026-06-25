// TEMPORAIRE — vérification que la clé ANTHROPIC_API_KEY est présente ET valide
// en production (via l'endpoint Models, gratuit : aucun token généré, clé jamais
// renvoyée). À SUPPRIMER après vérification.
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adPlannerAiEnabled } from "@/lib/aiAdPlanner";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!adPlannerAiEnabled()) {
    return NextResponse.json({ ok: false, configured: false, error: "ANTHROPIC_API_KEY absent" });
  }
  try {
    const m = await new Anthropic().models.retrieve("claude-opus-4-8");
    return NextResponse.json({ ok: true, configured: true, model: m.id });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, error: (e as Error).message });
  }
}
