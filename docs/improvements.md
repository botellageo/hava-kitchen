# Improvements — pms-midi5

## ⚠️ URGENT — sécurité

- **Révoquer la clé Anthropic exposée** (2026-05-14, mis à jour 2026-07-16)
  La clé `ANTHROPIC_API_KEY` a été exposée en clair dans un chat. Risque : facturation tierce si captée.
  Depuis le 2026-07-16, l'OCR tourne sur **Gemini via Vertex AI** (ADC, aucune clé) — la clé Anthropic n'est plus utilisée par l'app.
  Action restante (simplifiée) :
  1. https://console.anthropic.com/settings/keys → Delete `pms-midi5-firebase` (aucune clé de remplacement nécessaire)
  2. Nettoyage : `firebase functions:secrets:destroy ANTHROPIC_API_KEY -P hava-kitchen`

> Backlog de gaps identifiés en cours d'itération. Réévalués à chaque audit/retrospective.

## Backlog qualité — audit #2 (2026-07-16, refonte dashboard admin)

- **Extraire `AdminCardLoading`/`AdminCardEmpty`** dans `AdminCard.tsx` — markup « Chargement… » et état vide dupliqués à l'identique dans les 4 cards du dashboard.
- **Extraire `labelClass`** dans `EquipementFormModal.tsx` (classe de label répétée 5×, `inputClass` l'est déjà).
- **Unifier la validation des seuils** équipement : `EquipementFormModal` (NaN) et `lib/equipements.ts` (isFinite) vérifient la même règle différemment — faire appeler `validateEquipementInput` par le form.
- **Renommer `x`** dans `ExportsDdppCard.tsx` (`formatGenereLe(x)`, `.map((x) =>`) en `exportDoc`.

## Priorité — à faire avant MEP prod

### Branding & PWA (issu de It.1 review)

- **PNG icons pour iOS** — Les icônes actuelles sont en SVG. iOS Safari préfère PNG pour `apple-touch-icon` (sinon l'écran d'install peut être blanc). Générer `pwa-192.png` et `pwa-512.png` depuis les SVG. À faire avant que JB installe l'app sur l'iPad de prod.
- **Maskable icon safe zone** — Le SVG actuel ne respecte pas la safe zone maskable (contenu dans cercle de 80% du canvas). Pour Android Chrome avec icône adaptive, le "M5" risque d'être tronqué. À refaire avec padding correct quand on génère les PNG.

### Environnement dev

- **JDK 21+ requis** — Firebase Tools (emulators) refuse de démarrer avec JDK < 21. Local installé : JDK 17.0.12. À installer avant de pouvoir :
  - lancer `npm run test:rules` (tests Firestore Rules — Steps 4, 11)
  - lancer `firebase emulators:start` (Steps 10-13 : CF + tests CF)
  - tester l'auth en local via emulator
    → Installer Eclipse Temurin 21 LTS, mettre à jour `JAVA_HOME` et `PATH`.
    → Tant que JDK 21 pas en place, les tests rules sont écrits mais non validés contre l'emulator. Validation différée.

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

## Issus de l'Audit #1 (it.1, B+) — RÉSOLUS en it.2

- ✅ AppLogo extrait (6 pages)
- ✅ PinInput extrait (4 modals/pages)
- ✅ Modal wrapper extrait (5 modals)
- ✅ getInitials helper extrait
- ✅ CuisiniersPage split (296→141L) via CuisinierFormModal
- ✅ SetupRestaurantPage split (236→74L) via SetupStepResto + SetupStepPin
- ✅ Nav AdminLayout factorisée
- ✅ ToastProvider cleanup timers au unmount Provider
- ✅ cuisinierSessionSchema Zod (remplace validation inline)
- ✅ useCuisiniers.addCuisinier valide prenom/nom non vides avant write

### Reste à traiter (post it.2)

- **Validation Zod côté client createRestaurant/updateRestaurant** — best practice, les rules font le filet
- **`CuisinierPatch` index signature** — documenter le workaround ou typer via `UpdateData<...>` de Firestore SDK
- Tests composants : `NumericKeypad`, `PinKeypadModal`, `CuisinierSessionContext`, `QuickAddCuisinierModal`, `PairingQR`, `PairPage` (différés it.3+)

## Roadmap modules HACCP (futurs)

- Module **Températures** (sondes auto + graph 7j + saisie manuelle de fallback) — it.3+
- Module **Réception** (photo + OCR IA auto-remplissage) — it.4+, dépend de la livraison du matériel
- Module **Étiquettes DLC** (Brother QL-820NWB + templates produits) — it.4+, dépend de l'imprimante
- Module **Exports DDPP** (PDF/Excel mensuel) — it.5+
- Module **Plan de nettoyage** — it.6+
- Module **Non-conformités + actions correctives** — it.6+
