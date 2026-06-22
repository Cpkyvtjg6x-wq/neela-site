import { NextResponse } from "next/server";
import { googleEnabled, exchangeCode } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!googleEnabled()) return NextResponse.json({ error: "Google Calendar non configuré." }, { status: 501 });
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Code OAuth manquant." }, { status: 400 });
  try {
    await exchangeCode(code);
    // TODO Lot F : persister les tokens puis déclencher la synchro.
    return NextResponse.redirect(new URL("/crm/agenda?google=connected", req.url));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
