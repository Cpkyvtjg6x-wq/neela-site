"use server";

import { isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/supabaseAdmin";
import { popDansRayon, type PopMesure } from "@/lib/inseeCarreaux";

const TTL_DAYS = 30; // les carreaux INSEE bougent une fois par an : 30 j de cache, large.

// Mesure réelle de la population par tranche d'âge dans un rayon (carreaux INSEE 200 m),
// avec cache Supabase (neela_audience_cache). Gate sur l'auth CRM.
export async function mesurerPopulation(
  lat: number,
  lon: number,
  rayonKm: number
): Promise<{ ok: boolean; data?: PopMesure; error?: string }> {
  if (!isAuthed()) return { ok: false, error: "Non autorisé" };
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, error: "Coordonnées invalides." };

  const rLat = Math.round(lat * 1000) / 1000; // ~110 m → clé de cache stable
  const rLon = Math.round(lon * 1000) / 1000;
  const rKm = Math.max(1, Math.min(30, Math.round(rayonKm)));

  const db = getDb();

  // 1) cache
  try {
    const since = new Date(Date.now() - TTL_DAYS * 864e5).toISOString();
    const { data: hit } = await db
      .from("neela_audience_cache")
      .select("data, created_at")
      .eq("lat", rLat).eq("lon", rLon).eq("rayon_km", rKm)
      .gte("created_at", since)
      .maybeSingle();
    if (hit?.data) return { ok: true, data: hit.data as PopMesure };
  } catch {
    /* cache best-effort : on continue vers la mesure live */
  }

  // 2) mesure live (WFS Géoplateforme)
  let data: PopMesure;
  try {
    data = await popDansRayon(rLat, rLon, rKm);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  // 3) écriture cache (best-effort, ne bloque pas la réponse en cas d'échec)
  try {
    await db.from("neela_audience_cache").upsert({ lat: rLat, lon: rLon, rayon_km: rKm, data, created_at: new Date().toISOString() });
  } catch {
    /* ignore */
  }

  return { ok: true, data };
}
