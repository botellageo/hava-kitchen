# Improvements — pms-midi5

> Backlog de gaps identifiés en cours d'itération. Réévalués à chaque audit/retrospective.

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

## Issus de l'Audit #1 (it.1, B+)

### Polish / qualité code (it.2)

- **Extraire `<AppLogo />`** — header logo M5 + brand "Midi 5 / SUIVI HYGIÈNE" répété dans 6 pages (LoginPage, SetupRestaurantPage, AdminLayout, CuisinierSelectPage, CuisineHomePage, PairPage).
- **Extraire `<PinInput />`** — inputs password numérique 4-6 chiffres avec tracking + outline-brand répétés dans 3 fichiers (CuisinierFormModal, ParametresPage, QuickAddCuisinierModal).
- **Extraire `<Modal />`** — pattern fixed inset-0 bg-black/40 + max-w-md rounded-2xl shadow-modal répété dans 3 modals (CuisinierFormModal, ChangeManagerPinModal, QuickAddCuisinierModal, PinKeypadModal, PairingQRModal).
- **Helper `getInitials(prenom, nom)`** — calcul `${p.charAt(0)}${n.charAt(0)}.toUpperCase()` dupliqué dans CuisinierCard.tsx et CuisineHomePage.tsx.
- **Split `CuisiniersPage.tsx`** (296 lignes) — extraire `CuisinierFormModal` dans `src/components/admin/CuisinierFormModal.tsx`.
- **Split `SetupRestaurantPage.tsx`** (236 lignes) — extraire les 2 étapes du wizard en sous-composants.
- **Factoriser nav AdminLayout** — desktop + mobile dupliquent les NavLink. Définir un tableau et map.

### Robustesse runtime

- **ToastProvider** : cleanup tous les timers au unmount du Provider (`useEffect` retour cleanup qui itère sur `timers.current`). Mineur car Provider racine rarement démonté.
- **Validation Zod côté client** avant les writes Firestore dans `useRestaurant.createRestaurant`/`updateRestaurant` et `useCuisiniers.addCuisinier`. Les rules font le filet mais best practice Zod = validation côté client aussi.
- **`CuisinierSessionProvider`** : remplacer la validation inline localStorage par un `cuisinierSessionSchema.safeParse()` (Zod).
- **`CuisinierPatch` index signature** — documenter le workaround ou typer plus strictement via la signature `UpdateData<...>` de Firestore.

## Roadmap modules HACCP (futurs)

- Module **Températures** (sondes auto + graph 7j + saisie manuelle de fallback) — it.3+
- Module **Réception** (photo + OCR IA auto-remplissage) — it.4+, dépend de la livraison du matériel
- Module **Étiquettes DLC** (Brother QL-820NWB + templates produits) — it.4+, dépend de l'imprimante
- Module **Exports DDPP** (PDF/Excel mensuel) — it.5+
- Module **Plan de nettoyage** — it.6+
- Module **Non-conformités + actions correctives** — it.6+
