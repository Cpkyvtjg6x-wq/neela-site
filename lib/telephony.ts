// Abstraction téléphonie.
// Aujourd'hui : clic-pour-appeler via lien `tel:` natif.
// Au Lot F, brancher un vrai fournisseur (Twilio / Ringover) derrière la variable
// d'environnement TELEPHONY_PROVIDER, sans rien changer aux appelants ci-dessous.

export type CallTarget = { phone: string; prospectId?: string };

// Lien tel: nettoyé (chiffres + éventuel «+» international).
export function telHref(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : undefined;
}

// Un vrai fournisseur est-il configuré ? (serveur uniquement — Lot F)
export const telephonyConfigured = !!process.env.TELEPHONY_PROVIDER;
