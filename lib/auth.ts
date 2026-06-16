import { createHash } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "neela_auth";

// Jeton déterministe dérivé du mot de passe (jamais le mot de passe en clair dans le cookie).
export function expectedToken(): string {
  const pw = process.env.NEELA_CRM_PASSWORD || "";
  return createHash("sha256").update("neela::" + pw).digest("hex");
}

export function isAuthed(): boolean {
  if (!process.env.NEELA_CRM_PASSWORD) return false;
  const c = cookies().get(AUTH_COOKIE)?.value;
  return !!c && c === expectedToken();
}
