// Constantes et types partagés du CRM.

export type Prospect = {
  id: string;
  created_at: string;
  updated_at: string;
  nom: string | null;
  centre: string | null;
  ville: string | null;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  source: string;
  statut: string;
  interet: string | null;
  verif: string | null;
  notes: string | null;
  tags: string[] | null;
};

export type Call = {
  id: string;
  prospect_id: string;
  created_at: string;
  outcome: string | null;
  statut: string | null;
  interet: string | null;
  notes: string | null;
  rappel_at: string | null;
  tags: string[] | null;
  recording_path: string | null;
};

// Régions françaises par département (pour regrouper la prospection).
export const REGIONS: Record<string, string[]> = {
  "Nouvelle-Aquitaine": ["17", "33", "40", "64"],
  Occitanie: ["34", "30", "31", "11", "66"],
  "Provence-Alpes-Côte d'Azur": ["06", "13", "83", "84", "04", "05"],
};

export function regionForDept(dept: string | null): string {
  if (!dept) return "Autre";
  for (const [region, depts] of Object.entries(REGIONS)) {
    if (depts.includes(dept)) return region;
  }
  return "Autre";
}

// Couleur déterministe pour un tag (toujours la même pour un libellé donné).
const TAG_PALETTE = [
  { bg: "#EAF1FF", text: "#2563EB" },
  { bg: "#E8F6EE", text: "#059669" },
  { bg: "#FDECEC", text: "#DC2626" },
  { bg: "#FEF3E2", text: "#C2730A" },
  { bg: "#F1ECFE", text: "#7C3AED" },
  { bg: "#E7F6F8", text: "#0E7490" },
  { bg: "#FDEAF4", text: "#DB2777" },
  { bg: "#EEF2F6", text: "#475569" },
];

export function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

export type Appointment = {
  id: string;
  prospect_id: string | null;
  created_at: string;
  start_at: string;
  end_at: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  source: string;
  google_event_id: string | null;
};

export const STATUTS: { key: string; label: string }[] = [
  { key: "a_appeler", label: "À appeler" },
  { key: "a_rappeler", label: "À rappeler" },
  { key: "r1_pose", label: "R1 posé" },
  { key: "rdv_honore", label: "RDV honoré" },
  { key: "proposition", label: "Proposition" },
  { key: "signe", label: "Signé" },
  { key: "pas_interesse", label: "Pas intéressé" },
  { key: "perdu", label: "Perdu" },
];

export const OUTCOMES: { key: string; label: string }[] = [
  { key: "pas_reponse", label: "Pas de réponse" },
  { key: "messagerie", label: "Messagerie" },
  { key: "barrage", label: "Barrage secrétaire" },
  { key: "mauvais_num", label: "Mauvais numéro" },
  { key: "a_rappeler", label: "À rappeler" },
  { key: "pas_interesse", label: "Pas intéressé" },
  { key: "r1_pose", label: "R1 posé" },
  { key: "proposition", label: "Proposition envoyée" },
  { key: "signe", label: "Signé" },
];

export const INTERETS: { key: string; label: string; color: string }[] = [
  { key: "chaud", label: "Chaud", color: "#dc2626" },
  { key: "tiede", label: "Tiède", color: "#d97706" },
  { key: "froid", label: "Froid", color: "#2563eb" },
];

export function statutLabel(key: string | null) {
  return STATUTS.find((s) => s.key === key)?.label ?? key ?? "—";
}
export function outcomeLabel(key: string | null) {
  return OUTCOMES.find((s) => s.key === key)?.label ?? key ?? "—";
}
export function interetMeta(key: string | null) {
  return INTERETS.find((s) => s.key === key);
}
