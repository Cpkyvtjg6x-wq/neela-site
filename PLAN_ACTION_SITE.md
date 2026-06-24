# Plan d'action — Vers un site digne d'Apple 🍎

Objectif : passer d'un très beau site « agence » à une **expérience de marque** d'un
niveau Apple. Le code actuel est déjà excellent (Space Grotesk + Inter, smooth scroll
Lenis, animations Framer Motion, scroll horizontal épinglé, curseur custom, grain,
parallax). Ce qui manque pour atteindre le niveau « Apple » se joue sur **4 piliers** :
art direction photographique, performance, crédibilité, et obsession du détail.

> Légende priorité : 🔴 fort impact / rapide · 🟠 fort impact / moyen · 🟢 finitions

---

## Pilier 1 — Art direction & visuels (le plus gros levier)

L'écart n°1 avec Apple était l'absence de **vraies images**. C'est en cours de
correction (photos Higgsfield pour les pubs et les réalisations).

- 🔴 **Remplacer tous les dégradés placeholder par de la photo** — fait pour les
  maquettes de pub (`AdCard`, `PhoneStory`) et les réalisations. Étendre au Hero :
  ajouter un visuel de fond subtil ou une « device » (téléphone montrant une pub) à
  droite du titre, comme Apple met toujours le produit en scène.
- 🟠 **Photo réelle du fondateur** — le composant `Founder` est masqué faute de photo.
  Une vraie photo (ou un portrait Higgsfield cohérent) recrédibilise toute la page.
- 🟠 **Logos clients & visages** — les témoignages gagnent un photo + logo réels (même
  anonymisés : « Centre d'audition, Hérault »).
- 🟢 **Direction artistique unifiée** : même grain, même température de couleur, même
  profondeur de champ sur toutes les photos. Créer un mini « style guide » (1 page).
- 🟢 **Image Open Graph dédiée** (`/public/og.png`, 1200×630) pour les partages
  LinkedIn/WhatsApp — aujourd'hui aucun aperçu social.

## Pilier 2 — Performance (Apple = instantané)

- 🔴 **Optimiser les images** : les PNG générés font 4–6 Mo. Les convertir en WebP/AVIF
  (objectif < 300 Ko chacun). `next/image` sert déjà de l'AVIF/WebP automatiquement,
  mais partir d'un PNG léger accélère le build et le premier rendu.
  → `cwebp -q 82 in.png -o out.webp` ou un script `sharp`.
- 🟠 **Budget JavaScript** : Lenis + GSAP + Framer Motion, c'est lourd. GSAP n'est peut-être
  pas utilisé partout — auditer et retirer ce qui fait doublon avec Framer Motion.
- 🟠 **Lighthouse ≥ 95** sur mobile et desktop (Performance, SEO, Best Practices,
  Accessibilité). Viser LCP < 2,5 s, CLS ~ 0.
- 🟢 **Préchargement des polices** (`next/font` le fait déjà — vérifier le `display: swap`).

## Pilier 3 — Crédibilité & contenu

- 🔴 **Vraies études de cas chiffrées** dès le premier client signé (Optique La Flotte,
  Onecoute…). Une page « réalisation » avec avant/après, captures de pub réelles,
  courbe de RDV. C'est ce qui transforme un visiteur en prospect.
- 🟠 **Témoignages authentiques** (prénom, ville, métier, résultat) à la place des
  témoignages génériques.
- 🟠 **Page « Méthode »/« À propos »** qui raconte le pourquoi (storytelling Apple :
  on ne vend pas une fonctionnalité, on vend une vision).
- 🟢 **Preuves de conformité** mises en avant (réglementation pub santé) — c'est un
  argument différenciant fort sur ce marché.

## Pilier 4 — Obsession du détail (la « patte » Apple)

- 🔴 **Mobile** : le scroll horizontal épinglé peut être saccadé sur petit écran.
  Tester et, si besoin, basculer en carrousel vertical simple sous 768 px.
- 🟠 **Cohérence du mouvement** : une seule courbe d'easing (la constante `EASE` existe
  déjà — l'imposer partout), durées harmonisées, jamais de mouvement « gratuit ».
- 🟠 **Transitions de page** raffinées (le `template.tsx` existe) — un fondu/voile court
  et net entre les pages.
- 🟢 **Accessibilité** : `alt` sur toutes les images (fait pour les pubs), contrastes
  AA, navigation clavier, `prefers-reduced-motion` (déjà géré).
- 🟢 **Microcopie & typographie** : insécables avant `?` `!` `:` `;` `€`, pas de mots
  orphelins en fin de titre, ponctuation française soignée.
- 🟢 **Favicon + icônes** déclinés (light/dark, Apple touch icon).

---

## Séquencement conseillé (4 sprints)

| Sprint | Focus | Livrables |
|--------|-------|-----------|
| **1 — Visuel** | Pilier 1 | Photos pub + réalisations (en cours), photo fondateur, OG image |
| **2 — Perf** | Pilier 2 | Compression images, audit JS, Lighthouse ≥ 95 |
| **3 — Preuve** | Pilier 3 | 1–2 études de cas réelles, vrais témoignages, page À propos |
| **4 — Finitions** | Pilier 4 | Mobile, easing unifié, a11y, microcopie, favicons |

**Règle Apple à garder en tête :** *enlever* autant que possible. Moins d'éléments,
plus d'espace, un seul message par écran, un seul accent de couleur, un mouvement
au service du sens. La sophistication, c'est la simplicité maîtrisée.
