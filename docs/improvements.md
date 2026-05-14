# Improvements — pms-midi5

> Backlog de gaps identifiés en cours d'itération. Réévalués à chaque audit/retrospective.

## Priorité — à faire avant MEP prod

### Branding & PWA (issu de It.1 review)

- **PNG icons pour iOS** — Les icônes actuelles sont en SVG. iOS Safari préfère PNG pour `apple-touch-icon` (sinon l'écran d'install peut être blanc). Générer `pwa-192.png` et `pwa-512.png` depuis les SVG. À faire avant que JB installe l'app sur l'iPad de prod.
- **Maskable icon safe zone** — Le SVG actuel ne respecte pas la safe zone maskable (contenu dans cercle de 80% du canvas). Pour Android Chrome avec icône adaptive, le "M5" risque d'être tronqué. À refaire avec padding correct quand on génère les PNG.

### Sécurité & Cloud Functions

- **CF `deleteCuisinier` avec check références** — En it.1 la rule autorise `delete` au gérant sans vérifier l'absence de relevés HACCP qui pointent vers ce cuisinier. Quand on créera la sous-collection `releves_temperature` (it.3+), il faudra une CF callable qui :
  1. Vérifie que `auth.uid == restaurant.ownerUid`
  2. Compte les relevés référençant `cuisinierId`
  3. Refuse si > 0 (proposer soft delete `actif: false` à la place)
- **CF backup quotidien Firestore** — Stub déjà en place dans `functions/src/index.ts`. À finaliser une fois Blaze actif. Schedule 3h Europe/Paris, retention 30 jours.

### Workbox / PWA polish (it.2+)

- **globPatterns SVG** — Actuellement `**/*.svg` cache tous les SVG. Si on ajoute des illustrations lourdes plus tard, ça gonflera le precache. Restreindre aux icônes listées dans `includeAssets`.
- **Sentry DSN** — À configurer dans `.env.local` quand prêt à pousser en prod.

### Naming / cosmétique (faible priorité)

- `tailwind.config.js` : `brand.soft`/`brand.softer` peu discriminants ; `alert.bad` (red) dans la catégorie `alert` (amber) peut être renommé `danger` pour clarté sémantique. Pas bloquant.

## Roadmap modules HACCP (futurs)

- Module **Températures** (sondes auto + graph 7j + saisie manuelle de fallback) — it.3+
- Module **Réception** (photo + OCR IA auto-remplissage) — it.4+, dépend de la livraison du matériel
- Module **Étiquettes DLC** (Brother QL-820NWB + templates produits) — it.4+, dépend de l'imprimante
- Module **Exports DDPP** (PDF/Excel mensuel) — it.5+
- Module **Plan de nettoyage** — it.6+
- Module **Non-conformités + actions correctives** — it.6+
