// Constantes globales du site. Modifie ici tes coordonnées réelles.
export const SITE = {
  name: "Neela",
  // ⚠️ À remplacer par ton vrai domaine quand il sera branché.
  url: "https://neela-site.vercel.app",
  city: "France", // TODO: remplacer par ta ville (footer + JSON-LD)
  email: "contact@neelaagency.com",
  phone: "", // TODO: ton téléphone
  tagline: "Agence d'acquisition de patients",
  description:
    "Neela conçoit et pilote des campagnes Facebook & Instagram qui remplissent l'agenda des centres de santé indépendants. Création, ciblage, prise de rendez-vous — clé en main, et garanti.",
  socials: {
    linkedin: "#",
    instagram: "#",
    facebook: "#",
  },
} as const;

// Courbe d'easing maison utilisée partout (douce, jamais linéaire).
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
