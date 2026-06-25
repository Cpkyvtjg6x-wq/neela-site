// Configuration paramétrable de l'Ad Planner — ciblage géo + audience.
// AUCUN chiffre de population n'est codé ici : la population vient toujours
// d'une mesure réelle (carreaux INSEE via PostGIS, ou fallback commune signalé).
// Ce fichier ne contient que des HYPOTHÈSES marché, datées et ajustables.

export type Metier = "audio" | "optique" | "dentaire";

// Tranches d'âge = colonnes du fichier carroyé Filosofi (cohérence avec la source réelle).
export type Tranche = "18_24" | "25_39" | "40_54" | "55_64" | "65_79" | "80p";
export const TRANCHES: { key: Tranche; label: string }[] = [
  { key: "18_24", label: "18–24" },
  { key: "25_39", label: "25–39" },
  { key: "40_54", label: "40–54" },
  { key: "55_64", label: "55–64" },
  { key: "65_79", label: "65–79" },
  { key: "80p", label: "80 +" },
];

// Pyramide des âges nationale FR (part de la population TOTALE par tranche).
// Sert UNIQUEMENT au fallback « estimation commune » quand les carreaux ne sont
// pas chargés. Heuristique INSEE ~2023, à redater. (≈ 78 % = part des 18 ans et +.)
export const PYRAMIDE_FR: Record<Tranche, number> = {
  "18_24": 0.08, "25_39": 0.18, "40_54": 0.19, "55_64": 0.13, "65_79": 0.14, "80p": 0.06,
};

// Pénétration combinée Facebook ∪ Instagram par tranche d'âge (part de la tranche
// joignable sur Meta). Heuristique marché 2025 (Meltwater/Statista) — À CONFIRMER,
// jamais présentée comme une donnée officielle.
export const PENETRATION_FR: Record<Tranche, number> = {
  "18_24": 0.90, "25_39": 0.85, "40_54": 0.75, "55_64": 0.62, "65_79": 0.40, "80p": 0.18,
};

export const CONFIG = {
  rayonDefautKm: 8,
  rayonMinKm: 1,
  rayonMaxKm: 30, // borne Meta réelle 1–80 km, cappée à 30 pour un ciblage local crédible
  cpmEur: 9, // CPM Meta FR moyen — À CONFIRMER (6–14 €)
  capFrequenceMensuelle: 3, // impressions/personne/mois avant lassitude (heuristique)
  metaReachableFactor: 0.85, // Meta ne voit pas 100 % des comptes (doublons, inactifs)
  tauxInMarketMensuel: 0.012, // défaut, surchargé par métier
  partLeadsViaFormulaire: 1, // 100 % des leads via formulaire (audio/dentaire)
};

// Ciblage par métier — remplace les ex-ratios « share » / « density » inventés.
export const METIER_TARGETING: Record<
  Metier,
  { tranches: Tranche[]; ageMin: number; ageMax: number; tauxInMarketMensuel: number }
> = {
  audio:    { tranches: ["55_64", "65_79", "80p"],            ageMin: 55, ageMax: 65, tauxInMarketMensuel: 0.010 },
  optique:  { tranches: ["25_39", "40_54", "55_64", "65_79"], ageMin: 25, ageMax: 65, tauxInMarketMensuel: 0.020 },
  dentaire: { tranches: ["25_39", "40_54", "55_64", "65_79"], ageMin: 25, ageMax: 65, tauxInMarketMensuel: 0.015 },
};

export type PopParTranche = Partial<Record<Tranche, number>>;

// Audience Meta atteignable = Σ (pop de la tranche × pénétration) × facteur Meta.
// La `popParTranche` provient TOUJOURS d'une mesure (réelle ou fallback signalé).
export function audienceMetaEstimee(pop: PopParTranche, tranches: Tranche[]): number {
  let a = 0;
  for (const t of tranches) a += (pop[t] ?? 0) * PENETRATION_FR[t];
  return Math.round(a * CONFIG.metaReachableFactor);
}

export type TargetingSpec = {
  geo_locations: {
    custom_locations: { latitude: number; longitude: number; radius: number; distance_unit: "kilometer" }[];
  };
  age_min: number;
  age_max: number;
  publisher_platforms: string[];
};

// Targeting Meta DÉTERMINISTE (jamais généré par l'IA).
export function makeTargetingSpec(lat: number, lon: number, rayonKm: number, metier: Metier): TargetingSpec {
  const t = METIER_TARGETING[metier];
  return {
    geo_locations: {
      custom_locations: [
        { latitude: Math.round(lat * 1e6) / 1e6, longitude: Math.round(lon * 1e6) / 1e6, radius: Math.round(rayonKm), distance_unit: "kilometer" },
      ],
    },
    age_min: t.ageMin,
    age_max: t.ageMax, // Meta plafonne à 65 = « 65 et + »
    publisher_platforms: ["facebook", "instagram"],
  };
}
