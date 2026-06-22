// Modèles réutilisables (notes d'appel & SMS). {nom} est remplacé par le nom du prospect.

export type Template = { label: string; text: string };

export const NOTE_TEMPLATES: Template[] = [
  { label: "Pas de réponse", text: "Pas de réponse, à rappeler." },
  { label: "Barrage secrétaire", text: "Barrage secrétaire, décideur non joignable. Rappeler en demandant le responsable." },
  { label: "Messagerie", text: "Tombé sur la messagerie, message laissé." },
  { label: "Intéressé", text: "Intéressé — à recontacter pour fixer un RDV de découverte." },
  { label: "Pas le moment", text: "Pas disponible actuellement, recontacter dans quelques semaines." },
  { label: "Déjà accompagné", text: "Travaille déjà avec un prestataire — relancer plus tard." },
];

export const SMS_TEMPLATES: Template[] = [
  { label: "Suite à l'appel", text: "Bonjour {nom}, suite à notre échange, voici le lien pour réserver votre créneau découverte : [lien]. Belle journée — Neela." },
  { label: "Relance douce", text: "Bonjour {nom}, je reviens vers vous concernant l'acquisition de patients pour votre centre. Avez-vous 15 min cette semaine ? — Neela" },
  { label: "Confirmation RDV", text: "Bonjour {nom}, je vous confirme notre rendez-vous. À très vite ! — Neela" },
];

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "").trim() || `{${k}}`);
}
