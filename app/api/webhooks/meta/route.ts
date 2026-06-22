import { NextResponse } from "next/server";
import { metaEnabled, checkChallenge, verifySignature, fetchLead } from "@/lib/meta";
import { getDb } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Vérification d'abonnement du webhook (Meta envoie un GET avec hub.challenge).
export async function GET(req: Request) {
  if (!metaEnabled()) return new NextResponse("Not configured", { status: 404 });
  const url = new URL(req.url);
  const challenge = checkChallenge(
    url.searchParams.get("hub.mode"),
    url.searchParams.get("hub.verify_token"),
    url.searchParams.get("hub.challenge")
  );
  if (challenge) return new NextResponse(challenge, { status: 200 });
  return new NextResponse("Forbidden", { status: 403 });
}

// Réception d'un lead → création d'une fiche prospect (source "meta").
export async function POST(req: Request) {
  if (!metaEnabled()) return new NextResponse("Not configured", { status: 404 });
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Bad signature", { status: 401 });
  }
  let body;
  try { body = JSON.parse(raw); } catch { return new NextResponse("Bad body", { status: 400 }); }

  try {
    const db = getDb();
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;
        const leadgenId = change.value?.leadgen_id;
        if (!leadgenId) continue;
        const lead = await fetchLead(leadgenId);
        await db.from("neela_prospects").insert({
          nom: lead.name || "Lead Meta",
          telephone: lead.phone || null,
          email: lead.email || null,
          ville: lead.city || null,
          source: "meta",
          statut: "a_appeler",
        });
        // TODO Lot F : réponse automatique au lead (SMS/email) via la brique téléphonie/email.
      }
    }
  } catch {
    // On acquitte malgré tout pour éviter les renvois en boucle de Meta.
  }
  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
