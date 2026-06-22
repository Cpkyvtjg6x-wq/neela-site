"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, expectedToken, verifyPassword } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";

export type LoginState = { error: string | null };

const WINDOW_MS = 15 * 60 * 1000; // fenêtre de comptage
const MAX_ATTEMPTS = 5; // au-delà : verrouillage temporaire

function clientIp(): string {
  const h = headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Fail-closed : pas de mot de passe configuré = accès impossible.
  if (!process.env.NEELA_CRM_PASSWORD) {
    return {
      error:
        "Aucun mot de passe n'est configuré côté serveur (variable NEELA_CRM_PASSWORD manquante dans Vercel).",
    };
  }

  const pw = String(formData.get("password") || "");
  const ip = clientIp();
  const now = Date.now();

  // Rate-limiting (best-effort : si la base est indisponible, on n'empêche pas la connexion).
  let db: ReturnType<typeof getDb> | null = null;
  try { db = getDb(); } catch { db = null; }

  let count = 0;
  let windowStart = now;
  let blockedUntil = 0;
  if (db) {
    try {
      const { data } = await db.from("neela_login_attempts").select("*").eq("ip", ip).single();
      if (data) {
        count = data.count ?? 0;
        windowStart = data.window_start ? +new Date(data.window_start) : now;
        blockedUntil = data.blocked_until ? +new Date(data.blocked_until) : 0;
        if (now - windowStart > WINDOW_MS) { count = 0; windowStart = now; } // fenêtre expirée
      }
    } catch { /* best-effort */ }
  }

  if (blockedUntil > now) {
    const mins = Math.ceil((blockedUntil - now) / 60000);
    return { error: `Trop de tentatives. Réessaie dans ${mins} min.` };
  }

  // Délai progressif : ralentit le brute-force au fil des échecs.
  if (count > 0) await sleep(Math.min(2000, count * 300));

  if (!verifyPassword(pw)) {
    const newCount = count + 1;
    let blocked: string | null = null;
    if (newCount >= MAX_ATTEMPTS) {
      const lockMin = Math.min(30, 2 * (newCount - MAX_ATTEMPTS + 1)); // verrouillage progressif
      blocked = new Date(now + lockMin * 60000).toISOString();
    }
    if (db) {
      try {
        await db.from("neela_login_attempts").upsert({
          ip, count: newCount, window_start: new Date(windowStart).toISOString(), blocked_until: blocked,
        });
      } catch { /* best-effort */ }
    }
    return { error: blocked ? "Mot de passe incorrect. Trop de tentatives : accès verrouillé temporairement." : "Mot de passe incorrect." };
  }

  // Succès : on réinitialise le compteur.
  if (db) {
    try { await db.from("neela_login_attempts").delete().eq("ip", ip); } catch { /* best-effort */ }
  }

  cookies().set(AUTH_COOKIE, expectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });

  redirect("/crm");
}
