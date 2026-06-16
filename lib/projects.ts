// Données des réalisations. Remplace par tes vrais cas clients quand tu en auras.
export type Project = {
  slug: string;
  title: string;
  client: string;
  category: string;
  year: string;
  summary: string;
  result: string;
};

export const projects: Project[] = [
  {
    slug: "centre-audition-la-rochelle",
    title: "Remplir les créneaux de bilan auditif",
    client: "Centre d'audition · La Rochelle",
    category: "Acquisition · Meta Ads",
    year: "2026",
    summary:
      "Campagne locale ciblée sur l'agglomération et les proches aidants, avec tunnel de prise de rendez-vous et relances automatiques.",
    result: "23 rendez-vous qualifiés le premier mois · 14 € par RDV",
  },
  {
    slug: "story-instagram-audition",
    title: "Présence permanente en story",
    client: "Réseau de centres · Nouvelle-Aquitaine",
    category: "Création · Social Ads",
    year: "2026",
    summary:
      "Déclinaisons verticales plein écran, messages conformes à la réglementation santé, pensés pour l'audience senior et son entourage.",
    result: "92 % de taux de présence aux rendez-vous",
  },
  {
    slug: "tunnel-rdv-automatise",
    title: "Un tunnel de RDV qui tourne seul",
    client: "Centre indépendant · Charente-Maritime",
    category: "Système · Automatisation",
    year: "2026",
    summary:
      "Formulaire, agenda et relances SMS connectés. Le patient réserve, le centre n'a qu'à recevoir.",
    result: "Agenda du lundi rempli en continu",
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
