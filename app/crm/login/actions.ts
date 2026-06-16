"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const pw = String(formData.get("password") || "");

  if (!process.env.NEELA_CRM_PASSWORD) {
    return {
      error:
        "Aucun mot de passe n'est configuré côté serveur (variable NEELA_CRM_PASSWORD manquante dans Vercel).",
    };
  }
  if (pw !== process.env.NEELA_CRM_PASSWORD) {
    return { error: "Mot de passe incorrect." };
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
