// Téléphonie côté serveur — scaffolding multi-fournisseur (Twilio / Ringover).
// Désactivé proprement si TELEPHONY_PROVIDER absent : on retombe sur le lien tel: natif.
import { telHref } from "./telephony";

const provider = process.env.TELEPHONY_PROVIDER || ""; // "twilio" | "ringover" | ""

export function telephonyEnabled(): boolean {
  return !!provider;
}

export type PlaceCallResult =
  | { mode: "tel"; href?: string }
  | { mode: "provider"; ok: boolean; id?: string; error?: string };

// Lance un appel via le fournisseur si configuré, sinon renvoie le lien tel: (fallback navigateur).
export async function placeCall(phone: string): Promise<PlaceCallResult> {
  if (!provider) return { mode: "tel", href: telHref(phone) };
  try {
    if (provider === "twilio") {
      // TODO Lot F : POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Calls.json
      // avec TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM (Basic Auth).
      throw new Error("Twilio non implémenté (scaffold).");
    }
    if (provider === "ringover") {
      // TODO Lot F : API click-to-call Ringover avec RINGOVER_API_KEY.
      throw new Error("Ringover non implémenté (scaffold).");
    }
    return { mode: "provider", ok: false, error: `Fournisseur inconnu : ${provider}` };
  } catch (e) {
    return { mode: "provider", ok: false, error: (e as Error).message };
  }
}

export async function sendSms(phone: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!provider) return { ok: false, error: "Téléphonie non configurée." };
  if (!phone || !body) return { ok: false, error: "Paramètres SMS manquants." };
  // TODO Lot F : envoi SMS via le fournisseur + journalisation auto dans neela_calls/neela_activity.
  return { ok: false, error: "Envoi SMS non implémenté (scaffold)." };
}
