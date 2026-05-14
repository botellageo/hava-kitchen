# Feature Plan — It.1 Squelette PWA + Admin + Cuisine iPad

> Date : 2026-05-14 | Dev : Geoffrey | Statut : **EN COURS**
> Branche : `claude/interesting-taussig-f9ec09`

## Scope

Squelette de l'app PMS Midi 5 : PWA installable (app shell + cache lecture), Firebase Auth email/password pour JB (gérant), modèle Firestore multi-resto (`restaurants/{rid}/cuisiniers/{cid}`), CRUD cuisiniers depuis l'admin, écran cuisine iPad avec sélection profil + clavier PIN tactile. Header iPad prévoit l'emplacement du QR pairing (it.2).

## Hors scope it.1

- Photo + OCR IA réception (it.2/3 — matériel imprimante pas livré)
- Relevés de température (frigos pas reçus)
- Étiquettes DLC + Brother QL-820NWB (it.2/3)
- Exports DDPP (it.3+)
- CF backup quotidien (post-Blaze, après it.1)
- Alertes seuil
- Sentry DSN

## Challenge (validé)

| Axe                               | Décision                                                                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth JB**                       | Firebase Auth email/password seul. Compte créé en console (pas d'inscription publique).                                                                                                                                     |
| **Auth cuisinier (iPad)**         | Sélection profil + PIN 4-6 chiffres. Session locale (localStorage) sur l'iPad. Identité métier `createdBy: cuisinierId`.                                                                                                    |
| **PIN cuisinier**                 | Stocké hashé via PBKDF2 (SHA-256, 100 000 itérations, salt 16 bytes). Web Crypto natif.                                                                                                                                     |
| **PIN gérant**                    | PIN 4-6 chiffres distinct du mdp Firebase, stocké hashé sur `restaurants/{rid}`. Configuré au wizard setup. Sert à débloquer la création rapide d'un cuisinier depuis l'écran cuisine (sans repasser par l'admin).          |
| **Quick-add cuisinier (cuisine)** | Tile "+" dans la grille de sélection → modal PIN gérant → modal mini-form (prénom + nom + PIN + confirmation PIN) → cuisinier créé.                                                                                         |
| **Modèle data**                   | Multi-resto : `restaurants/{rid}` + `restaurants/{rid}/cuisiniers/{cid}`. Sub-collections HACCP en sous-collection (futur).                                                                                                 |
| **Rules legacy**                  | Nettoyage : suppression de `users/{uid}`, `organisations/{orgId}`, `releves_temperature` racine + test obsolète.                                                                                                            |
| **Suppression cuisinier**         | Hard delete autorisé en it.1 (pas encore de relevé). Note : CF `deleteCuisinier` à ajouter en it.3+ pour bloquer si relevés existent.                                                                                       |
| **Toast**                         | Composant maison (~40 lignes), pas de dep.                                                                                                                                                                                  |
| **PWA offline**                   | App shell + cache lecture (NetworkFirst Firestore, CacheFirst assets). Écritures online uniquement.                                                                                                                         |
| **Mobile-first**                  | Tablette iPad (md: 768+) prioritaire. Boutons larges pour cuisine.                                                                                                                                                          |
| **Branding**                      | Palette maquette HTML (`C:\Users\botel\Desktop\midi5\PMS_04_demo_app.html`). Emerald `#10b981 → #059669` (logo, accents), dark green `#064e3b` (titres, brand text), fond `#f3f4f6`. Tailwind palette `brand.*` configurée. |
| **QR pairing tel**                | **Inclus dans it.1** : init Cloud Functions + Blaze + CF createPairingToken / redeemPairingToken + QR sur iPad + page /pair côté tel.                                                                                       |

---

## Step 1 — Setup PWA + Branding (vite-plugin-pwa + palette maquette)

**Commit** : `chore(pwa): setup vite-plugin-pwa + branding emerald maquette`

**Fichiers** :

- MODIFY `package.json` — ajout `vite-plugin-pwa`
- MODIFY `vite.config.ts` — config plugin PWA (manifest theme `#064e3b`, workbox)
- CREATE `public/pwa-192.svg` — icon M5 sur gradient emerald (`#10b981 → #059669`)
- CREATE `public/pwa-512.svg` — icon M5 sur gradient emerald
- MODIFY `index.html` — meta theme-color `#064e3b`, lang fr, apple-touch-icon, app title
- MODIFY `tailwind.config.js` — palette `brand.*`, `surface.*`, `alert.*`, `info.*` alignées maquette

**Validation** : `npm run build` produit `dist/sw.js` et `dist/manifest.webmanifest`. Icônes vertes visibles. Palette Tailwind accessible via `bg-brand`, `text-brand-darker`, etc.

---

## Step 2 — AuthProvider Firebase Auth + page login

**Commit** : `feat(auth): AuthProvider Firebase + page login email/password`

**Fichiers** :

- CREATE `src/contexts/AuthContext.tsx` — AuthProvider, useAuth, signIn/signOut
- CREATE `src/components/ProtectedRoute.tsx` — guard route
- CREATE `src/pages/LoginPage.tsx` — formulaire email/password
- MODIFY `src/App.tsx` — routes /login + structure layout
- MODIFY `src/main.tsx` — wrap avec AuthProvider

**Validation** : `/login` charge sans crash. Connexion avec un compte Firebase Auth (créé en console) → redirige `/admin`.

---

## Step 3 — Schémas Zod restaurant + cuisinier + utilitaire PIN

**Commit** : `feat(schemas): schemas Zod restaurant/cuisinier + PIN PBKDF2`

**Fichiers** :

- CREATE `src/lib/schemas/restaurant.ts` — `{ nom, ownerUid, adresse?, managerPinHash, managerPinSalt, createdAt, updatedAt }`
- CREATE `src/lib/schemas/cuisinier.ts` — `{ prenom, nom, pinHash, pinSalt, actif, createdAt, updatedAt }`
- CREATE `src/lib/pin.ts` — `hashPin(pin)`, `verifyPin(pin, hash, salt)`, PBKDF2 Web Crypto
- CREATE `src/lib/pin.test.ts` — hash deterministe avec salt, verify match/mismatch
- MODIFY `src/lib/schemas/index.ts` — re-exports

**Validation** : `npm test` passe. `hashPin('1234')` retourne hash + salt. `verifyPin('1234', hash, salt) === true`. `verifyPin('9999', hash, salt) === false`.

---

## Step 4 — Réécriture firestore.rules + tests rules

**Commit** : `feat(rules): rules multi-resto restaurants/cuisiniers + tests`

**Fichiers** :

- MODIFY `firestore.rules` — suppression rules legacy + nouvelles rules `restaurants/{rid}` et `restaurants/{rid}/cuisiniers/{cid}`
- DELETE `src/test/rules/releves_temperature.test.ts` — obsolète (modèle racine remplacé)
- CREATE `src/test/rules/restaurants.test.ts` — owner read/write, anon refused, other user refused
- CREATE `src/test/rules/cuisiniers.test.ts` — owner CRUD, anon refused, cross-resto refused

**Validation** : `npm run test:rules` passe.

---

## Step 5 — Hooks Firestore : useRestaurant + useCuisiniers

**Commit** : `feat(hooks): useRestaurant + useCuisiniers avec CRUD`

**Fichiers** :

- CREATE `src/hooks/useRestaurant.ts` — query `where ownerUid == auth.uid`, `createRestaurant`, `updateRestaurant`
- CREATE `src/hooks/useCuisiniers.ts` — onSnapshot liste, `addCuisinier`, `updateCuisinier`, `deleteCuisinier`, `toggleActif`
- CREATE `src/hooks/useCuisiniers.test.ts` — mock Firestore, vérifier hash PIN avant write

**Validation** : `npm test` passe, mock Firestore confirme que les écritures passent par schéma Zod + PIN hashé.

---

## Step 6 — Toast maison

**Commit** : `feat(ui): toast context et composant maison`

**Fichiers** :

- CREATE `src/contexts/ToastContext.tsx` — provider + useToast + composant Toast (~50 lignes)
- CREATE `src/contexts/ToastContext.test.tsx` — affichage, auto-dismiss

**Validation** : `npm test` passe.

---

## Step 7 — Wizard création restaurant (1er login)

**Commit** : `feat(setup): wizard creation restaurant + PIN gerant au premier login`

**Fichiers** :

- CREATE `src/pages/SetupRestaurantPage.tsx` — wizard 2 étapes : (1) nom + adresse, (2) PIN gérant + confirmation
- MODIFY `src/App.tsx` — route /setup + redirect logic (si auth && no resto → /setup)

**Validation** : 1er login d'un compte fraîchement créé → redirige `/setup`. Étape 1 : nom + adresse. Étape 2 : keypad PIN gérant + confirmation. Soumission → resto créé en Firestore (avec `managerPinHash`/`managerPinSalt`) + redirige `/admin`.

---

## Step 8 — Admin layout + page cuisiniers + page paramètres

**Commit** : `feat(admin): page admin liste cuisiniers + parametres PIN gerant`

**Fichiers** :

- CREATE `src/pages/admin/AdminLayout.tsx` — sidebar/header admin, logout
- CREATE `src/pages/admin/CuisiniersPage.tsx` — liste + bouton ajout + modal édition + form (prenom/nom/PIN)
- CREATE `src/pages/admin/ParametresPage.tsx` — bouton "Modifier le PIN gérant" (modal ancien PIN + nouveau + confirmation)
- CREATE `src/components/admin/CuisinierRow.tsx` — ligne liste avec actions (modif/désactiver/supprimer)
- MODIFY `src/App.tsx` — routes /admin, /admin/cuisiniers, /admin/parametres

**Validation** : Ajout cuisinier → apparaît dans la liste (live). Modification → mise à jour. Désactivation → grise la ligne. Suppression → demande confirmation puis supprime. PIN gérant modifiable depuis Paramètres.

---

## Step 9a — Session cuisinier + clavier numérique

**Commit** : `feat(cuisine): session cuisinier localStorage + clavier PIN`

**Fichiers** :

- CREATE `src/contexts/CuisinierSessionContext.tsx` — `{ cuisinier, setCuisinier, clearSession }` + localStorage sync
- CREATE `src/components/cuisine/NumericKeypad.tsx` — 0-9 + clear + valider, boutons larges tactiles
- CREATE `src/components/cuisine/PinKeypadModal.tsx` — modal saisie PIN + verifyPin + error

**Validation** : `npm test` (test NumericKeypad). Le contexte conserve la session après reload.

---

## Step 9b — Page sélection cuisinier + accueil cuisine

**Commit** : `feat(cuisine): page selection cuisinier + accueil avec header`

**Fichiers** :

- CREATE `src/pages/cuisine/CuisinierSelectPage.tsx` — grille de cards (cuisiniers actifs) + tile "+"
- CREATE `src/components/cuisine/CuisinierCard.tsx` — card prenom + initiale, large tactile
- CREATE `src/components/cuisine/AddCuisinierTile.tsx` — tile "+" stylée pareil que les cards
- CREATE `src/pages/cuisine/CuisineHomePage.tsx` — header avec nom cuisinier + emplacement réservé QR + bouton "Changer d'utilisateur"
- MODIFY `src/App.tsx` — routes /cuisine, /cuisine/home

**Validation** : Clic sur cuisinier → modal PIN → bon PIN → /cuisine/home. Mauvais PIN → erreur affichée. "Changer d'utilisateur" → retour grille. Tile "+" présente mais clic ne fait rien encore (branché en Step 9c).

---

## Step 9c — Quick-add cuisinier depuis la cuisine

**Commit** : `feat(cuisine): quick-add cuisinier avec PIN gerant`

**Fichiers** :

- CREATE `src/components/cuisine/RequireManagerPinModal.tsx` — modal PIN gérant + vérification via `verifyPin` contre `managerPinHash` du resto
- CREATE `src/components/cuisine/QuickAddCuisinierModal.tsx` — modal mini-form (prénom + nom + PIN + confirmation PIN)
- MODIFY `src/pages/cuisine/CuisinierSelectPage.tsx` — brancher les modals sur le tile "+"

**Validation** : Tap "+" → modal PIN gérant. PIN gérant correct → modal mini-form. Validation form → cuisinier créé → toast → retour grille avec nouvelle card visible.

---

## Step 10 — Init Cloud Functions + Blaze + emulator config

**Pré-requis** : Geoffrey a activé Blaze sur le projet Firebase `hava-kitchen`.

**Commit** : `chore(functions): init CF runtime + emulator + tests setup`

**Fichiers** :

- MODIFY `functions/package.json` — dépendances firebase-functions v6+, firebase-admin
- MODIFY `functions/src/index.ts` — squelette CF avec auth helpers
- MODIFY `firebase.json` — emulator functions port + UI
- CREATE `functions/src/lib/auth.ts` — helper `requireAuth`, `requireOwner(rid)`
- CREATE `functions/.env.example` — variables d'env CF
- MODIFY `.gitignore` — `functions/lib`, `functions/.env`

**Validation** : `firebase emulators:start --only functions,firestore,auth` démarre OK. UI sur :4000 affiche Functions.

---

## Step 11 — CF pairingTokens (create + redeem) + tests emulator

**Commit** : `feat(functions): CF createPairingToken et redeemPairingToken`

**Fichiers** :

- CREATE `functions/src/pairing.ts` — 2 callables :
  - `createPairingToken({ cuisinierId })` — auth requise (owner du resto), crée doc `restaurants/{rid}/pairingTokens/{tid}` avec expiresAt = now + 5min, retourne `tokenId`
  - `redeemPairingToken({ tokenId, restaurantId })` — auth requise (peut être anonyme), vérifie token valide, marque `usedAt`, retourne custom token avec claims `{ restaurantId, cuisinierId, role: 'cuisinier' }`
- MODIFY `functions/src/index.ts` — export pairing functions
- CREATE `src/test/functions/pairing.test.ts` — tests emulator (token créé, redemption valide, expiré refusé, déjà utilisé refusé)
- MODIFY `firestore.rules` — ajout sous-collection `pairingTokens` (write par CF uniquement, read jamais côté client)

**Validation** : tests emulator passent. Token créé → redemption une fois OK, deuxième redemption refusée.

---

## Step 12 — Génération QR sur iPad (qrcode.react) + modal zoom

**Commit** : `feat(cuisine): generation QR pairing iPad + modal zoom`

**Fichiers** :

- MODIFY `package.json` — ajout `qrcode.react`
- CREATE `src/components/cuisine/PairingQR.tsx` — composant qui appelle `createPairingToken` toutes les 4min et affiche le QR (payload = URL `https://<host>/pair?token=<tid>&rid=<rid>`)
- CREATE `src/components/cuisine/PairingQRModal.tsx` — modal plein écran avec QR XL au tap
- MODIFY `src/pages/cuisine/CuisineHomePage.tsx` — header avec nom cuisinier + `<PairingQR />` à droite + tap → modal

**Validation** : QR généré, tap → modal plein écran. Rafraîchissement auto avant expiration. Erreur réseau gérée proprement.

---

## Step 13 — Page /pair côté tel + signInWithCustomToken + logout

**Commit** : `feat(pair): page tel cuisinier scan QR et auth via custom token`

**Fichiers** :

- CREATE `src/pages/PairPage.tsx` — lit `?token=&rid=` du query, signInAnonymously si pas déjà auth, appelle `redeemPairingToken`, fait `signInWithCustomToken`, redirige vers `/cuisine/home`
- MODIFY `src/App.tsx` — route `/pair`
- MODIFY `src/contexts/CuisinierSessionContext.tsx` — détection de la session via custom claims (token), bouton logout (signOut) + clear session

**Validation** : Test bout-à-bout : iPad génère QR → scan navigateur tel → /pair charge → redemption → cuisinier authentifié → /cuisine/home avec son nom affiché.

---

## Step 14 — Tests composants clés + audit final

**Commit** : `test: composants critiques + cleanup`

**Fichiers** :

- CREATE `src/components/cuisine/NumericKeypad.test.tsx`
- CREATE `src/contexts/CuisinierSessionContext.test.tsx`
- CREATE `src/components/cuisine/QuickAddCuisinierModal.test.tsx`

**Après** : `/audit` complet → si PASS → `/update-docs` → `/deploy-firebase` (rules + functions) → push.

---

## Notes

- Le service worker PWA cache l'app shell mais **pas Firebase Auth** (Auth nécessite réseau pour login). Acceptable : JB se connecte une fois en début de service, puis le token persiste.
- La rule `restaurants/{rid}/cuisiniers/{cid}` autorise `allow delete: if isRestoOwner(rid)` en it.1. À durcir en it.3+ via CF qui check absence de relevés.
- L'header iPad affichera "QR — disponible en itération 2" comme placeholder pour mémoire UX.
- Mémo à mettre dans `docs/improvements.md` à la fin :
  - It.2 : passage Blaze + CF createPairingToken/redeemPairingToken + génération QR
  - It.3 : sous-collection releves_temperature + CF deleteCuisinier (check références)
