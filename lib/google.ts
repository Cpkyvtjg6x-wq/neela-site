// Google Calendar — scaffolding OAuth. Désactivé si GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI absents.
const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = process.env.GOOGLE_REDIRECT_URI || "";

export function googleEnabled(): boolean {
  return !!(clientId && clientSecret && redirectUri);
}

export function getAuthUrl(state = ""): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  if (!res.ok) throw new Error(`Échange OAuth Google échoué (${res.status}).`);
  return res.json();
}

// TODO Lot F : persister les tokens (table à créer) + synchro 2 sens des neela_appointments
// (champ google_event_id déjà présent) + rappels.
