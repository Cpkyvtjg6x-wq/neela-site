// IA Ad Planner — couche Claude / Anthropic (étape e).
// Module SERVEUR uniquement : ne jamais l'importer dans un composant client
// (la clé ANTHROPIC_API_KEY ne doit jamais atteindre le navigateur).
//
// Garde-fou central : l'IA n'INVENTE JAMAIS de population, d'audience ou de
// nombre de concurrents. Ces chiffres sont mesurés côté app (carreaux INSEE /
// fallback commune / API Meta) et transmis à l'IA en LECTURE SEULE. Les seules
// valeurs numériques que l'IA produit (CPL, taux, honoraires) sont en plus
// bornées ici, côté serveur, aux mêmes plages que les curseurs de l'UI — donc
// une valeur aberrante (ou « hallucinée ») ne peut pas fausser le calcul.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export function adPlannerAiEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("IA non configurée (ANTHROPIC_API_KEY absent).");
  if (!client) client = new Anthropic(); // lit ANTHROPIC_API_KEY depuis l'environnement
  return client;
}

// ---- Suggestion d'hypothèses de campagne ----------------------------------

export type CompLevel = "faible" | "moyenne" | "forte";

export type AdPlannerSuggestInput = {
  metier: "audio" | "optique" | "dentaire";
  metierLabel: string;
  zone: {
    ville?: string;
    adresse?: string;
    rayonKm?: number;
    // Chiffres RÉELS mesurés — l'IA ne doit ni les modifier ni en inventer d'autres.
    populationCiblee?: number;
    audienceMeta?: number;
    concurrents?: number;
    intensiteConcurrence: CompLevel;
  };
  actuel: { cpl: number; leadToRdv: number; presence: number; closing: number; fee: number };
};

export type AdPlannerSuggestion = {
  cpl: number; leadToRdv: number; presence: number; closing: number;
  compLevel: CompLevel; fee: number; rationale: string;
};

const SUGGEST_SYSTEM = `Tu es un consultant senior en publicité Meta (Facebook & Instagram) pour des professionnels de santé locaux en France (audioprothésistes, opticiens, cabinets dentaires).

On te transmet, en JSON : le métier, la zone et ses chiffres déjà MESURÉS (population ciblée, audience Meta atteignable, nombre de concurrents) ainsi que les hypothèses actuelles. Tu proposes des hypothèses de campagne RÉALISTES et prudentes pour le marché français 2025 :
- cpl : coût par lead en euros (Meta FR, leads plus froids que Google)
- leadToRdv : taux de conversion lead → RDV, en pourcentage
- presence : taux de présence effective au RDV, en pourcentage
- closing : taux de transformation RDV → vente, en pourcentage
- compLevel : intensité concurrentielle de la zone ("faible" | "moyenne" | "forte")
- fee : honoraires mensuels d'agence recommandés en euros
- rationale : 2 à 3 phrases qui justifient les choix, en français.

INTERDIT : inventer, recalculer ou modifier les chiffres de population, d'audience atteignable ou de concurrents. Ils te sont fournis comme des faits en lecture seule ; tu peux t'en servir pour calibrer la concurrence et le CPL, jamais pour les contredire. Reste crédible : ne promets jamais des taux flatteurs.

Réponds STRICTEMENT par un seul objet JSON valide avec exactement ces clés (cpl, leadToRdv, presence, closing, compLevel, fee, rationale), sans texte avant/après, sans bloc de code Markdown.`;

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Réponse IA illisible.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function firstText(msg: Anthropic.Message): string {
  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

const clampNum = (n: unknown, lo: number, hi: number, dflt: number): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : dflt;
};

export async function suggestConfig(input: AdPlannerSuggestInput): Promise<AdPlannerSuggestion> {
  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SUGGEST_SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });

  const p = parseJsonObject(firstText(msg));
  const a = input.actuel;
  const lvl = p.compLevel;
  // Bornage serveur = mêmes plages que les curseurs de l'UI → impossible d'injecter une valeur hors champ.
  return {
    cpl: clampNum(p.cpl, 4, 40, a.cpl),
    leadToRdv: clampNum(p.leadToRdv, 15, 80, a.leadToRdv),
    presence: clampNum(p.presence, 50, 95, a.presence),
    closing: clampNum(p.closing, 10, 60, a.closing),
    compLevel: lvl === "faible" || lvl === "moyenne" || lvl === "forte" ? lvl : input.zone.intensiteConcurrence,
    fee: clampNum(p.fee, 300, 3000, a.fee),
    rationale: typeof p.rationale === "string" ? p.rationale.slice(0, 600) : "",
  };
}

// ---- Explication d'un plan déjà chiffré -----------------------------------

export type AdPlannerPlanInput = {
  metierLabel: string;
  mode: "objectif" | "budget";
  zone?: string;
  rayonKm?: number;
  // Chiffres DÉJÀ CALCULÉS par l'app : l'IA les commente, ne les recalcule pas.
  budgetPubMensuel: number;
  honoraires: number;
  leadsMois: number;
  rdvMois: number;
  ventesMois: number;
  margeGeneree: number;
  margeNette: number;
  retourParEuro: number;
  cplEffectif: number;
  audienceMeta?: number;
  couverturePct?: number;
  paybackMois?: number | null;
};

const EXPLAIN_SYSTEM = `Tu es consultant chez Neela, une agence qui pilote des campagnes Meta Ads pour des professionnels de santé locaux. On te donne un plan média DÉJÀ CHIFFRÉ par notre simulateur.

Rédige une explication claire et convaincante en français (≈130 à 180 mots) que l'agence pourra présenter à son client : ce que la campagne vise, comment les RDV puis les ventes et la marge sont projetés, le retour sur investissement, et 1 à 2 points de vigilance honnêtes (Meta = leads plus froids, montée en puissance progressive). Ton professionnel et concret, sans jargon.

INTERDIT : recalculer, arrondir différemment ou inventer le moindre chiffre. Utilise UNIQUEMENT les nombres fournis, tels quels. Ne garantis jamais un nombre de RDV ou de ventes : parle de projection. Réponds uniquement par le texte à présenter (pas de titre, pas de Markdown, pas de préambule).`;

export async function explainPlan(input: AdPlannerPlanInput): Promise<string> {
  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: EXPLAIN_SYSTEM,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });
  const text = firstText(msg).trim();
  if (!text) throw new Error("Réponse IA vide.");
  return text;
}
