// Helpers géographiques (client) — géocodage d'adresse + estimation de population.
// Géocodage via la BAN servie par l'IGN (data.geopf.fr) : gratuit, sans clé.
import { PYRAMIDE_FR, type PopParTranche, type Tranche } from "./adPlannerConfig";

export type GeoPoint = { lat: number; lon: number; label: string; citycode?: string; city?: string };

type BanFeature = {
  geometry: { coordinates: [number, number] };
  properties: { label: string; citycode?: string; city?: string; score?: number };
};

function parseBan(data: unknown): GeoPoint[] {
  const feats = (data as { features?: BanFeature[] })?.features ?? [];
  return feats.map((f) => ({
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    label: f.properties.label,
    citycode: f.properties.citycode,
    city: f.properties.city,
  }));
}

// Autocomplétion d'adresse (rue / numéro).
export async function suggestAdresses(q: string): Promise<GeoPoint[]> {
  if (q.trim().length < 3) return [];
  try {
    const res = await fetch(
      `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(q)}&limit=6&autocomplete=1`
    );
    return parseBan(await res.json());
  } catch {
    return [];
  }
}

// Géocodage ferme (meilleur résultat).
export async function geocodeAdresse(q: string): Promise<GeoPoint | null> {
  const list = await (async () => {
    try {
      const res = await fetch(`https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(q)}&limit=1`);
      return parseBan(await res.json());
    } catch {
      return [];
    }
  })();
  return list[0] ?? null;
}

export type CommuneInfo = { nom: string; population: number; surfaceKm2: number };

// Population + surface de la commune (pour le fallback « estimation »).
export async function fetchCommune(citycode: string): Promise<CommuneInfo | null> {
  try {
    const res = await fetch(`https://geo.api.gouv.fr/communes/${citycode}?fields=nom,population,surface`);
    const d = await res.json();
    if (!d || typeof d.population !== "number" || typeof d.surface !== "number") return null;
    return { nom: d.nom, population: d.population, surfaceKm2: d.surface * 0.01 }; // surface en hectares → km²
  } catch {
    return null;
  }
}

/**
 * Estimation de population par tranche dans un rayon — FALLBACK uniquement
 * (avant chargement des carreaux INSEE). Prorata surfacique mono-commune ×
 * pyramide des âges nationale. À signaler clairement comme « estimation ».
 */
export function popFallbackParTranche(communePop: number, surfaceKm2: number, rayonKm: number): PopParTranche {
  const circle = Math.PI * rayonKm * rayonKm;
  const fraction = surfaceKm2 > 0 ? Math.min(1, circle / surfaceKm2) : 1;
  const popInRadius = communePop * fraction;
  const out: PopParTranche = {};
  (Object.keys(PYRAMIDE_FR) as Tranche[]).forEach((t) => {
    out[t] = Math.round(popInRadius * PYRAMIDE_FR[t]);
  });
  return out;
}
