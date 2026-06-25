// Mesure de population RÉELLE par rayon — étape c.
// Source : INSEE Filosofi « carreaux 200 m » 2019, servis par la Géoplateforme IGN
// (WFS, gratuit, sans clé). On interroge à la demande la bbox autour du point, on
// filtre les carreaux dont le centre tombe dans le rayon, et on agrège la population
// par tranche d'âge. AUCUN préchargement, AUCUN PostGIS : la donnée reste chez l'INSEE.
//
// Module SERVEUR (appelé via une server action) : pas de souci CORS, et on peut cacher.
import type { PopParTranche, Tranche } from "./adPlannerConfig";

const WFS = "https://data.geopf.fr/wfs/ows";
const LAYER = "INSEE.FILOSOFI.INDICATORS:carreaux_200m";
const PAGE = 10000;        // features par requête
const MAX_PAGES = 8;       // garde-fou (≤ 80 000 carreaux ≈ très grand rayon)

export type PopMesure = {
  popParTranche: PopParTranche;
  nbCarreaux: number;
  nbCommunes: number;
  communes: string[];
  source: "insee_carreaux_200m";
  approx: boolean; // true si le plafond de pagination a été atteint (sous-estimation possible)
};

type Feat = {
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
  properties: Record<string, number | string | null>;
};

const KM_PER_DEG_LAT = 110.574;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Centre approximatif d'un carreau (centre de sa bbox — suffisant à 200 m de résolution).
function centroid(g: Feat["geometry"]): [number, number] | null {
  let ring: number[][] | undefined;
  if (g.type === "Polygon") ring = (g.coordinates as number[][][])[0];
  else if (g.type === "MultiPolygon") ring = (g.coordinates as number[][][][])[0]?.[0];
  if (!ring || ring.length === 0) return null;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2]; // [lon, lat]
}

const n = (v: number | string | null | undefined) => (typeof v === "number" ? v : Number(v)) || 0;

async function fetchPage(bbox: string, startIndex: number): Promise<{ feats: Feat[]; matched: number }> {
  const url =
    `${WFS}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=${LAYER}` +
    `&OUTPUTFORMAT=application/json&SRSNAME=CRS:84&COUNT=${PAGE}&STARTINDEX=${startIndex}&BBOX=${bbox},CRS:84`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`WFS Géoplateforme indisponible (${res.status}).`);
    const d = await res.json();
    return { feats: (d.features ?? []) as Feat[], matched: d.numberMatched ?? 0 };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Population réelle par tranche d'âge dans un rayon autour d'un point (lat, lon).
 * Tranches Filosofi disponibles : 25_39, 40_54, 55_64, 65_79, 80p. La tranche 18_24
 * n'existe pas en colonne dédiée → on la dérive en résidu (ind total − autres tranches).
 */
export async function popDansRayon(lat: number, lon: number, rayonKm: number): Promise<PopMesure> {
  const r = Math.max(0.5, Math.min(30, rayonKm));
  const dLat = r / KM_PER_DEG_LAT;
  const dLon = r / (111.32 * Math.cos(toRad(lat)) || 1);
  const buf = 0.003; // ~330 m : inclure les carreaux de bord avant filtrage au centre
  const bbox = [lon - dLon - buf, lat - dLat - buf, lon + dLon + buf, lat + dLat + buf]
    .map((x) => x.toFixed(6)).join(","); // minLon,minLat,maxLon,maxLat (CRS:84)

  const acc: Record<Tranche, number> = { "18_24": 0, "25_39": 0, "40_54": 0, "55_64": 0, "65_79": 0, "80p": 0 };
  const communes = new Set<string>();
  let nbCarreaux = 0, approx = false, startIndex = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { feats, matched } = await fetchPage(bbox, startIndex);
    for (const f of feats) {
      const c = centroid(f.geometry);
      if (!c) continue;
      if (haversineKm(lat, lon, c[1], c[0]) > r) continue; // centre hors rayon
      const p = f.properties;
      const p25 = n(p.ind_25_39), p40 = n(p.ind_40_54), p55 = n(p.ind_55_64), p65 = n(p.ind_65_79), p80 = n(p.ind_80p);
      const others = n(p.ind_0_3) + n(p.ind_4_5) + n(p.ind_6_10) + n(p.ind_11_17) + p25 + p40 + p55 + p65 + p80;
      acc["18_24"] += Math.max(0, n(p.ind) - others);
      acc["25_39"] += p25; acc["40_54"] += p40; acc["55_64"] += p55; acc["65_79"] += p65; acc["80p"] += p80;
      const nom = p.nom_com; if (typeof nom === "string" && nom) communes.add(nom);
      nbCarreaux++;
    }
    startIndex += feats.length;
    if (feats.length < PAGE || startIndex >= matched) break;
    if (page === MAX_PAGES - 1) approx = true;
  }

  const popParTranche: PopParTranche = {};
  (Object.keys(acc) as Tranche[]).forEach((t) => { popParTranche[t] = Math.round(acc[t]); });

  return {
    popParTranche,
    nbCarreaux,
    nbCommunes: communes.size,
    communes: Array.from(communes).sort(),
    source: "insee_carreaux_200m",
    approx,
  };
}
