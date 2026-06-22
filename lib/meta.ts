// Meta Lead Ads — vérification webhook + récupération du lead. Désactivé si non configuré.
import { createHmac, timingSafeEqual } from "crypto";

const verifyToken = process.env.META_VERIFY_TOKEN || "";
const appSecret = process.env.META_APP_SECRET || "";
const pageToken = process.env.META_PAGE_ACCESS_TOKEN || "";

export function metaEnabled(): boolean {
  return !!(verifyToken && appSecret);
}

// Vérification d'abonnement (GET hub.challenge).
export function checkChallenge(mode: string | null, token: string | null, challenge: string | null): string | null {
  if (mode === "subscribe" && token && verifyToken && token === verifyToken) return challenge;
  return null;
}

// Vérifie la signature HMAC (X-Hub-Signature-256) en temps constant.
export function verifySignature(raw: string, signature: string | null): boolean {
  if (!appSecret || !signature) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type MetaLead = { name?: string; phone?: string; email?: string; city?: string };

// Récupère les champs du lead via la Graph API (nécessite un page access token).
export async function fetchLead(leadgenId: string): Promise<MetaLead> {
  if (!pageToken) return {};
  const res = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(pageToken)}`);
  if (!res.ok) return {};
  const data = await res.json();
  const out: MetaLead = {};
  for (const f of data.field_data || []) {
    const v = f.values?.[0];
    if (!v) continue;
    if (/full_name|^name$|nom/i.test(f.name)) out.name = v;
    else if (/phone/i.test(f.name)) out.phone = v;
    else if (/email/i.test(f.name)) out.email = v;
    else if (/city|ville/i.test(f.name)) out.city = v;
  }
  return out;
}
