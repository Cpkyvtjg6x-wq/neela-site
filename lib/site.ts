// Constantes globales du site. Modifie ici tes coordonnées réelles.
export const SITE = {
  name: "Neela",
  // ⚠️ Mettre "https://neelaagency.com" une fois le domaine branché sur Vercel.
  url: "https://neela-site.vercel.app",
  city: "Montpellier",
  email: "contact@neelaagency.com",
  phone: "07 83 64 09 05",
  tagline: "Agence d'acquisition de patients",
  description:
    "Neela conçoit et pilote des campagnes Facebook & Instagram qui remplissent l'agenda des centres de santé indépendants. Création, ciblage, prise de rendez-vous — clé en main, et garanti.",
  // Mets tes vrais liens quand ils existent ; tant que c'est "#" ils sont masqués.
  socials: {
    linkedin: "#",
    instagram: "#",
    facebook: "#",
  },
} as const;

// Courbe d'easing maison utilisée partout (douce, jamais linéaire).
export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
