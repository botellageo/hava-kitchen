# pms-midi5 — Memory

> Phase courante : Itération 2 — Polish (extractions composants) (TERMINÉE)
> Prochaine : Itération 3 — premier module HACCP (probablement relevé température)

## Phases

- ✅ Phase 0 — Itération 0 : Setup initial (2026-05-14)
  - Squelette Vite 8 + React 19 + TS strict + Firebase 12 + Tailwind 3 + Zod 4
  - Garde-fous : Husky, ESLint, Prettier, lint-staged, Vitest, rules-unit-testing
  - 10 slash commands actifs (`/feature`, `/review`, `/audit`, `/deep-audit`, etc.)
  - CF backup quotidien stub (nécessite Blaze)
  - Firestore Rules legacy : `users`, `organisations`, `releves_temperature` racine (remplacées en it.1)

- ✅ Phase 1 — Itération 1 : Squelette PWA + Admin + Cuisine + QR pairing (2026-05-14, 41 créé + 6 modifiés, audit **B+**, 0 bug)
  - **PWA installable** : vite-plugin-pwa, manifest, workbox (NetworkFirst Firestore, CacheFirst Storage), icônes M5 gradient emerald, theme-color `#064e3b`
  - **Branding maquette HTML** : Tailwind palette custom `brand.*`/`surface.*`/`alert.*`/`info.*`, fontFamily system-ui
  - **Auth Firebase email/password gérant** : `AuthContext.ts` + `AuthProvider.tsx` + `useAuth` + `ProtectedRoute` + `LoginPage` (erreurs traduites FR)
  - **Modèle Firestore multi-resto** : `restaurants/{rid}` + sub `cuisiniers/{cid}` + sub `pairingTokens/{tid}` (CF only). Anciennes rules legacy supprimées.
  - **Schémas Zod** : `restaurant.ts` (avec managerPinHash/Salt), `cuisinier.ts` (pinHash/Salt + actif). `pin.ts` PBKDF2 SHA-256 100k iter + 16B salt + constant-time compare (16 tests).
  - **Firestore Rules** : owner read+CRUD restaurants, cuisinier authentifié via custom claim `restaurantId` peut read resto, sub-cuisiniers owner-only CRUD, pairingTokens client read+write `false`. Helpers `isRestoOwner` + `isCuisinierOfResto`. 24 tests rules écrits (différés JDK 21).
  - **Wizard setup restaurant** : 2 étapes (nom/adresse → PIN gérant + confirmation) avec `RequireRestaurant` guard
  - **Admin** : `AdminLayout` (header + nav + logout), `DashboardPage` (3 tuiles : Cuisiniers / Paramètres / Mode cuisine), `CuisiniersPage` (CRUD complet + form modal inline 296L), `ParametresPage` (modifier PIN gérant avec verify ancien)
  - **Cuisine iPad** : `CuisinierSelectPage` (grille tactile + tile "+" quick-add), `CuisineHomePage` (user-chip + QR pairing + tuiles "À venir"), `NumericKeypad` + `PinKeypadModal` + `CuisinierCard` + `AddCuisinierTile`
  - **Quick-add cuisinier depuis cuisine** : tile "+" → PIN gérant → mini-form (prénom/nom/PIN/confirm) → addCuisinier
  - **Toast maison** : `ToastContext` + `ToastProvider` (success/error/info, auto-dismiss 4s, empilage, dismiss clic)
  - **Cloud Functions pairing** : `createPairingToken` (auth gérant + assertRestoOwner) + `redeemPairingToken` (anon, transaction usedAt single-use, custom token avec claim `{ restaurantId, cuisinierId, role: 'cuisinier' }`)
  - **QR pairing iPad** : `qrcode.react`, `PairingQR` auto-refresh 1min avant expiration (TTL serveur 5min), `PairingQRModal` zoom plein écran
  - **Page /pair téléphone cuisinier** : `signInAnonymously` → `redeemPairingToken` → `signInWithCustomToken` → set session cuisinier → redirect `/cuisine/home`. Rollback `signOut` si chargement profil échoue après token.
  - **Hooks** : `useRestaurant` (CRUD + verifyManagerPin + claim cuisinier support avec cancellation `loadGenRef`), `useCuisiniers` (live `onSnapshot` + addCuisinier hash PIN + verifyCuisinierPin), `useCuisinierSession` (localStorage sync)
  - **17 commits**, **53/53 tests vitest passent** (pin 16, useCuisiniers 5, Toast 5, ErrorBoundary 3, rules 24)
  - **Audit #1 B+** : 0 BLOQUANT, 2 WARNING critiques fixés (race condition useRestaurant + rollback signOut PairPage), 4 WARNING reportés it.2 (cleanup timers Toast, splits pages > 200L, duplications AppLogo/PinInput/Modal), 10 faux positifs éliminés
  - **Dette tracée** : JDK 21 requis pour test:rules + CF emulator (cf. memory `dev_env_jdk21`), Blaze à activer pour deploy CF, PNG icons + maskable safe zone pour iOS install

- ✅ Phase 2 — Itération 2 : Polish extractions composants (2026-05-14, 7 commits, 0 changement de comportement)
  - **`<AppLogo />`** centralisé (size sm/md + showBrand + brandName) — 6 pages refactorées
  - **`<PinInput />`** centralisé (filtre numérique + tracking + maxLength config) — 4 modals/pages refactorés
  - **`<Modal />`** wrapper (backdrop + container + variant default/overlay + size sm/md + ESC + a11y dialog) — 5 modals refactorés
  - **Helper `getInitials(prenom, nom)`** — `src/lib/initials.ts`
  - **Split `CuisiniersPage`** : `CuisinierFormModal` extrait → 296L à 141L
  - **Split `SetupRestaurantPage`** : `SetupStepResto` + `SetupStepPin` extraits → 236L à 74L
  - **Factorisation nav AdminLayout** : `<AdminNav />` inline avec tableau NAV_ITEMS — plus de duplication desktop/mobile
  - **ToastProvider cleanup timers** : useEffect cleanup au unmount Provider (HMR/ErrorBoundary safe)
  - **`cuisinierSessionSchema` Zod** : remplace la validation manuelle inline dans CuisinierSessionProvider
  - **`useCuisiniers.addCuisinier`** : validation prenom/nom non vides avant addDoc
  - **Tous les fichiers passent < 200 lignes** (convention CLAUDE.md respectée)
  - 53/53 tests Vitest continuent à passer ✓

## Collections Firestore actives (après it.1)

| Path                                    | Schéma                                                                                             | Access pattern                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `restaurants/{rid}`                     | `restaurantSchema` (nom, ownerUid, adresse?, managerPinHash, managerPinSalt, createdAt, updatedAt) | Gérant CRUD owner-only ; cuisinier (claim) peut read             |
| `restaurants/{rid}/cuisiniers/{cid}`    | `cuisinierSchema` (prenom, nom, pinHash, pinSalt, actif, createdAt, updatedAt)                     | Gérant CRUD owner du resto parent                                |
| `restaurants/{rid}/pairingTokens/{tid}` | (CF only — pas de schéma Zod côté client)                                                          | Aucun accès client, CF `createPairingToken`/`redeemPairingToken` |

## Cloud Functions actives (après it.1)

| Function               | Région       | Auth                               | Description                                                                                    |
| ---------------------- | ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `createPairingToken`   | europe-west1 | Gérant (auth + assertRestoOwner)   | Crée token 5min single-use pour pairing tel                                                    |
| `redeemPairingToken`   | europe-west1 | Anonymous accepté (token = preuve) | Échange token contre custom Firebase Auth token avec claim `restaurantId`+`cuisinierId`+`role` |
| `dailyFirestoreBackup` | europe-west1 | onSchedule (3h Europe/Paris)       | Stub, à finaliser une fois bucket GCS créé                                                     |

## Décisions architecturales notables (it.1)

- **Auth iPad** : session JB persistante (Firebase Auth email/password) + PIN cuisinier en identité métier (localStorage). Pas de bascule de session Firebase sur iPad — simplicité + traçabilité métier via `createdBy: cuisinierId`.
- **Auth tél cuisinier** : QR pairing → custom token CF avec claims. Le tél a sa propre session Firebase Auth avec `role: 'cuisinier'`.
- **PIN gérant ≠ mot de passe Firebase** : PIN 4-6 chiffres distinct, stocké hashé sur `restaurants/{rid}`, utilisé pour débloquer la création rapide de cuisinier depuis l'écran cuisine.
- **Hard delete cuisinier autorisé en it.1** (pas encore de relevés HACCP référençant). À durcir en it.3+ avec CF `deleteCuisinier` qui vérifie absence de relevés.
- **Ownership immutable** : `restaurants/{rid}.ownerUid` ne peut pas être modifié (anti-takeover dans les rules).
- **Maquette HTML** (`PMS_04_demo_app.html`) = référence visuelle (palette emerald `#10b981`/`#064e3b`, typo system-ui), pas référence parcours.

## Tests

- **53 tests Vitest** passent : `pin.test.ts` (16), `useCuisiniers.test.ts` (5), `ToastProvider.test.tsx` (5), `ErrorBoundary.test.tsx` (3), `restaurants.test.ts` (11), `cuisiniers.test.ts` (13)
- Les 24 tests rules tournent contre l'emulator Firestore — nécessite JDK 21+ (actuellement JDK 17 → différés)
- Aucun test pour `NumericKeypad`, `PinKeypadModal`, `CuisinierSessionContext`, `QuickAddCuisinierModal`, `PairingQR`, `PairPage` (différés it.2)
