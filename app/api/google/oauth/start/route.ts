import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { googleEnabled, getAuthUrl } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!googleEnabled()) return NextResponse.json({ error: "Google Calendar non configuré." }, { status: 501 });
  return NextResponse.redirect(getAuthUrl());
}
