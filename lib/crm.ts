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
};

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
