# PMS Midi 5 — Instructions Claude Code

> Projet solo dev de Geoffrey. PMS HACCP custom pour le restaurant Midi 5 (JB). Docs: `docs/` | Rules: `.claude/rules/`

## Projet

| Item                | Valeur                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| **Nom**             | pms-midi5                                                              |
| **Stack**           | Vite + React 19 + TypeScript strict + Firebase 12 + Tailwind 3 + Zod   |
| **Owner**           | Geoffrey BOTELLA — développe SEUL (frontend, backend, rules, CF)       |
| **Projet Firebase** | `hava-kitchen`                                                         |
| **Domaine**         | PMS HACCP (Plan de Maîtrise Sanitaire) — données critiques traçabilité |

## Domaine HACCP — vocabulaire essentiel

- **PMS** : Plan de Maîtrise Sanitaire (obligation légale resto, art. R231-19 CRPM)
- **HACCP** : Hazard Analysis Critical Control Points — méthode d'analyse des risques
- **CCP** : Critical Control Point — étape critique à surveiller (ex: température frigo)
- **Relevé de température** : mesure tracée (équipement, valeur, datetime, opérateur)
- **Traçabilité produit** : DLC, lot, origine, réception
- **Plan de nettoyage** : fréquence, zone, produit, opérateur, validation
- **Non-conformité** : écart constaté (ex: temp > seuil) → action corrective requise
- **IMMUTABILITÉ** : un relevé HACCP ne se modifie/supprime JAMAIS (preuve sanitaire en cas de contrôle DDPP)

> Le concurrent direct est **ePackPro** (ex-e-pack HYGIENE, CHR Numérique). L'enjeu pour Midi 5 est d'avoir un PMS adapté à l'usage terrain, pas un usine à gaz.

## Workflow Geoffrey (solo)

1. `/feature` → challenge 4 axes + plan step-by-step
2. Claude Code implémente chaque step
3. `/review` → avant chaque commit
4. `/audit` → après feature complète
5. `/update-docs` → synchronise docs
6. Push branche → merge sur `main`

Pas de Cursor. Pas de Benoit. Pas de division front/back — Geoffrey tient tout.

## Skills disponibles

| Skill               | Usage                                        | Quand                             |
| ------------------- | -------------------------------------------- | --------------------------------- |
| `/feature`          | Challenge 4 axes + plan + exécution guidée   | Nouvelle feature                  |
| `/review`           | Scripts + agent adaptatif anti-hallucination | Avant chaque commit               |
| `/audit`            | 3 agents par type bug + vérificateur         | Après itération                   |
| `/deep-audit`       | Audit complet du codebase                    | Avant MEP / tous les 10 it.       |
| `/brief-status`     | État projet                                  | Début de session                  |
| `/retrospective`    | Tendances N itérations                       | Tous les 10 it.                   |
| `/update-docs`      | Synchronise docs                             | Après audit                       |
| `/deploy-firebase`  | Déploiement Hosting + Rules + CF             | Après audit PASS                  |
| `/setup`            | Onboarding fresh clone                       | Nouveau PC ou reprise après pause |
| `/add-module-haccp` | Bootstrap module HACCP (Zod+rule+hook+test)  | Nouveau type de relevé/document   |

## Garde-fous solo dev (déjà actifs)

| Garde-fou                                              | Rôle                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **TS strict** (`noUncheckedIndexedAccess`)             | Bloque les accès non typés à compile-time                                     |
| **Zod** (`src/lib/schemas/`)                           | Valide chaque doc Firestore au runtime                                        |
| **`parseDoc()`** (`src/lib/firestore.ts`)              | Lecture safe : throw si invalide                                              |
| **ErrorBoundary** (`src/components/ErrorBoundary.tsx`) | Crash React ne casse pas l'écran complet                                      |
| **Sentry** (`src/lib/sentry.ts`)                       | Alerte si JB crashe en prod                                                   |
| **Husky + lint-staged**                                | Pas de commit avec ESLint/Prettier KO                                         |
| **Vitest + RTL**                                       | Tests unitaires + composants. `npm test`                                      |
| **`@firebase/rules-unit-testing`**                     | Tests Security Rules — immutabilité HACCP validée. `npm run test:rules`       |
| **Firestore Rules**                                    | Auth obligatoire + relevés HACCP immutables (`allow update,delete: if false`) |
| **Firebase Emulator**                                  | Dev sans toucher la prod (`VITE_USE_EMULATOR=true`)                           |
| **CF backup quotidien**                                | Sauvegarde Firestore 3h Europe/Paris                                          |

## Hooks Claude Code (`.claude/settings.json`)

- **PreCompact** : réinjecte le contexte hava-kitchen avant compaction
- **PostToolUse** (Edit/Write) : auto-prettier sur `.ts|.tsx|.js|.jsx|.json|.css|.md`
- **PreToolUse** (Bash) : lance `.claude/hooks/pre-git-check.sh`
  - sur `git commit` → `npx tsc -b --noEmit` (bloque si erreur TS)
  - sur `git commit` → scan secrets (regex AIzaSy, sk*live*, private_key, etc.)
  - sur `git push` → bloque force-push sur `main`

## Rules disponibles (`.claude/rules/`)

- `firebase-conventions.md` — collections, naming, DTO pattern, Rules
- `security.md` — credentials, PII, immutabilité HACCP
- `testing.md` — Vitest + React Testing Library
- `react-conventions.md` — React 19 + TS strict + Tailwind
- `haccp-domain.md` — vocabulaire métier HACCP + immutabilité légale

## Fichiers clés (à créer au fur et à mesure)

- `docs/memory.md` — état complet + décisions
- `docs/audit_history.md` — historique des audits
- `docs/improvements.md` — backlog gaps
- `src/lib/schemas/` — un fichier Zod par collection Firestore
- `src/test/rules/` — tests Security Rules (lance via `npm run test:rules`)
- `src/test/setup.ts` — setup global Vitest (jest-dom, cleanup)
- `vitest.config.ts` — config Vitest (jsdom, alias @, coverage)
- `firestore.rules` — Security Rules (déjà setup, relevés immutables)
- `functions/src/index.ts` — Cloud Functions (backup quotidien)

## Règles d'or

1. Toujours typer les docs Firestore avec un schéma **Zod** (`src/lib/schemas/<collection>.ts`)
2. Toujours lire avec **`parseDoc()`** ou `tryParseDoc()`, jamais `snap.data()` direct
3. Toujours ajouter une **Security Rule** pour chaque nouvelle collection
4. Tester en **Emulator** avant de toucher la prod (`VITE_USE_EMULATOR=true`)
5. Ne jamais committer `.env.local`
6. Pour les données **HACCP** : `allow update, delete: if false;` → traçabilité immutable

## Anti-hallucination (philosophie Anthropic)

- Agents par **TYPE DE BUG** (Crashes / Sécurité / Qualité) — pas par rôle
- "RELIS le code avant de remonter", vérificateur élimine les faux positifs
- Model tiering : sonnet pour analyse, opus pour vérification
- **JAMAIS de recommandation fonctionnelle ou métier** dans les agents

## État actuel

- **Itération 5** — Refonte Espace gestion admin (dashboard façon maquette) — TERMINÉE 2026-07-16, audit #2 **A-**
- Branche `claude/admin-dashboard-maquette` (6 commits) — à merger sur `main` + déployer (hosting + **rules** obligatoires : 2 nouvelles sous-collections)
- OCR réceptions basculé sur **Gemini 2.5 Flash via Vertex AI** (2026-07-16) — zéro clé API (ADC), déployé en prod. Prérequis nouvelle instance : API `aiplatform` + rôle `aiplatform.user` au compte de service compute.

### Itérations passées

- ✅ It.0 — Setup initial (squelette + garde-fous, 2026-05-14)
- ✅ It.1 — PWA + Auth + Schémas Zod + Rules multi-resto + Hooks + Admin + Cuisine + CF pairing + QR (2026-05-14, B+)
- ✅ It.2 — Polish : extractions AppLogo/PinInput/Modal/getInitials, split CuisiniersPage + SetupRestaurantPage < 200L, nav AdminLayout factorisée, ToastProvider cleanup timers, cuisinierSessionSchema Zod (2026-05-14, 53/53 tests OK, refactor pur)
- ✅ It.3/4 — Signup gérant + Réception photo OCR + Étiquettes DLC (aperçu live, PDF, chips produits) + page admin Produits + 3 sous-collections HACCP (2026-05, mergé sur main le 2026-07-16)
- ✅ It.5 — Refonte dashboard admin façon maquette : 4 cards inline (Équipe / Frigos & sondes / Templates / Exports DDPP), collection `equipements` (+ seed démo), registre DDPP mensuel PDF + trace `exportsDdpp` create-only, suppression pages Cuisiniers/Produits (2026-07-16, audit #2 A-)

### Acquis it.1

- PWA installable (vite-plugin-pwa) + branding maquette emerald (`brand.*`/`surface.*` Tailwind palette)
- Auth Firebase email/password gérant + ProtectedRoute + RequireRestaurant
- Modèle Firestore multi-resto : `restaurants/{rid}` + `restaurants/{rid}/cuisiniers/{cid}` + sub `pairingTokens/{tid}` (CF only)
- Schémas Zod : `restaurant.ts`, `cuisinier.ts` ; utilitaire `pin.ts` PBKDF2 SHA-256 100k iter + 16B salt
- Firestore Rules réécrites : owner CRUD + cuisinier authentifié via custom claim `restaurantId`, anti-impersonation/anti-takeover sur `restaurants/{rid}`
- Hooks : `useRestaurant` (CRUD + verifyManagerPin + cancellation guard) + `useCuisiniers` (live + verifyCuisinierPin)
- Toast maison (`<ToastProvider>`)
- Admin : Dashboard + CuisiniersPage CRUD + ParametresPage (modifier PIN gérant)
- Cuisine iPad : sélection profil + clavier PIN tactile + quick-add depuis cuisine (PIN gérant + mini-form)
- Cloud Functions : `createPairingToken` (auth gérant) + `redeemPairingToken` (anon, transaction, custom token avec claims)
- QR pairing iPad (`qrcode.react`, auto-refresh) + Page `/pair` côté tel cuisinier (signInWithCustomToken + rollback signOut)
- 53/53 tests Vitest passent. 24 tests rules écrits (différés JDK 21).

### Dette & blockers tracés

- **JDK 21+ requis** pour `npm run test:rules` et `firebase emulators` (actuellement JDK 17). Cf. `docs/improvements.md`.
- **Plan Blaze à activer** sur projet Firebase `hava-kitchen` pour déployer les CF (`pairing` + `dailyFirestoreBackup`).
- **Sentry DSN** à configurer dans `.env.local` quand prêt prod.
- **PNG icons + maskable safe zone** pour iOS install (icônes actuelles en SVG).
- **It.2 polish** : extractions `<AppLogo />`, `<PinInput />`, `<Modal />` (cf. `docs/improvements.md`), split `CuisiniersPage` (296L) et `SetupRestaurantPage` (236L).

### Fichiers > 200 lignes à surveiller

`generateRegistrePdf.ts` à 205 lignes (lib, pas composant — OK). Plus gros composant : `EquipementFormModal.tsx` à 172 lignes.

### Prochaine étape

→ Compte « resto démo » pré-rempli pour les démos restaurateurs, puis module Températures en saisie manuelle (sondes = roadmap). Backlog qualité audit #2 dans `docs/improvements.md`.
