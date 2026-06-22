import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "neela_auth";

// Jeton déterministe dérivé du mot de passe (jamais le mot de passe en clair dans le cookie).
export function expectedToken(): string {
  const pw = process.env.NEELA_CRM_PASSWORD || "";
  return createHash("sha256").update("neela::" + pw).digest("hex");
}

// Comparaison en temps constant (évite les fuites de timing).
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Vérifie le mot de passe en temps constant (on hash des deux côtés → longueur fixe, pas de fuite).
export function verifyPassword(pw: string): boolean {
  const expected = process.env.NEELA_CRM_PASSWORD;
  if (!expected) return false; // fail-closed
  const a = createHash("sha256").update(pw).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function isAuthed(): boolean {
  if (!process.env.NEELA_CRM_PASSWORD) return false; // fail-closed
  const c = cookies().get(AUTH_COOKIE)?.value;
  return !!c && safeEqual(c, expectedToken());
}
