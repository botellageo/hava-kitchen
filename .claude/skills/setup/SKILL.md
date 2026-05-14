---
name: setup
description: Onboarding pour reprendre le projet pms-midi5 après un clone fresh — install, env, emulator, premier run. À utiliser quand Geoffrey clone le repo sur un nouveau PC ou veut valider qu'un environnement fonctionne.
---

# /setup — Onboarding pms-midi5

> Guide pas-à-pas pour démarrer le projet après un clone fresh.

## Objectif

Amener un nouveau clone de `botellageo/hava-kitchen` à l'état "app qui tourne en local avec emulator", en < 15 minutes.

## Prérequis (à vérifier en premier)

Lance ces checks et **liste explicitement à Geoffrey** ce qui manque :

| Check                  | Commande                                                          | Version min |
| ---------------------- | ----------------------------------------------------------------- | ----------- |
| Node.js                | `node --version`                                                  | ≥ 20.x      |
| npm                    | `npm --version`                                                   | ≥ 10.x      |
| Java JDK (Emulators)   | `java -version`                                                   | ≥ 21        |
| Firebase CLI           | `firebase --version`                                              | ≥ 13.x      |
| GitHub CLI (optionnel) | `gh --version`                                                    | ≥ 2.x       |
| Git                    | `git config --global user.name && git config --global user.email` | —           |

Si un manque :

- **Node** : https://nodejs.org/ (LTS)
- **Java 21** : https://adoptium.net/temurin/releases/?version=21
- **Firebase** : `npm install -g firebase-tools`
- **gh** : optionnel, `winget install GitHub.cli` ou skip

## Étapes (à exécuter dans l'ordre)

### 1. Installer les dépendances

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Demande à Geoffrey de remplir `.env.local` avec sa config Firebase (Project Settings → Web App → firebaseConfig).

**Valeurs obligatoires** :

- `VITE_FIREBASE_API_KEY` (publique, OK dans bundle)
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID` (= `hava-kitchen`)
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Garder** `VITE_USE_EMULATOR=true` par défaut.
`VITE_SENTRY_DSN` peut rester vide en dev.

### 3. Login Firebase + lier le projet

```bash
firebase login          # si pas déjà fait
firebase use hava-kitchen
```

### 4. Compiler les Cloud Functions

```bash
cd functions && npm run build && cd ..
```

### 5. Démarrer l'Emulator Suite (terminal 1)

```bash
npm run emulators
```

⚠️ Vérifier que les **5 emulators démarrent OK** (auth/firestore/storage/functions/hosting) — UI sur http://127.0.0.1:4000

Si erreur Java : vérifier `java -version` ≥ 21.

### 6. Démarrer Vite (terminal 2)

```bash
npm run dev
```

Vérifier dans le navigateur (`http://localhost:5173` ou autre port indiqué) :

- L'app charge sans erreur
- Le badge "**🔧 Emulator local**" est affiché (en orange) — pas "🌐 Firebase prod"

### 7. Valider la chaîne tests

```bash
npm run typecheck     # doit retourner 0 erreur
npm run lint          # doit retourner 0 erreur
npm test              # tests doivent passer
```

(Optionnel) Tests des Security Rules : `npm run test:rules` (l'emulator doit tourner).

### 8. Validation finale

Demander à Geoffrey :

- [ ] Tu vois l'UI Emulators sur http://127.0.0.1:4000 ?
- [ ] L'app tourne sur le port Vite annoncé et indique "🔧 Emulator local" ?
- [ ] Les tests Vitest passent (`npm test`) ?
- [ ] `git status` propre (rien de non-trackable inattendu) ?

Si tout coché → environnement opérationnel, on peut attaquer une feature.

## Diagnostic en cas de problème

| Symptôme                          | Cause probable                        | Fix                                                       |
| --------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| `Variables d'env manquantes`      | `.env.local` pas rempli               | Cf. étape 2                                               |
| `Emulators won't start (Java)`    | Java < 21                             | Installer JDK 21 (cf. prérequis)                          |
| `Port 5173 in use`                | Vite déjà lancé ailleurs (aerotask ?) | Soit kill l'autre, soit utiliser le port que Vite annonce |
| `🌐 Firebase prod` au lieu d'Emul | `VITE_USE_EMULATOR` ≠ `true`          | Éditer `.env.local`                                       |
| Husky pre-commit échoue           | Manque deps dev                       | `npm install`                                             |
| `firebase use` échoue             | Pas loggé                             | `firebase login` puis retry                               |

## Rappels importants à mentionner

- `.env.local` est dans `.gitignore` → ne JAMAIS le committer
- Mode emulator par défaut → tu ne touches PAS la prod
- Pour pousser en prod : `firebase deploy --only ...` (voir skill `/deploy-firebase`)
- En cas de doute sur la stack ou les conventions, lire `CLAUDE.md` et `.claude/rules/`

## Anti-patterns

- ❌ Lancer `npm run dev` avant d'avoir rempli `.env.local` → throw au démarrage (Zod sur env)
- ❌ Lancer `firebase deploy` sans `firebase use hava-kitchen` au préalable → risque de deploy sur le mauvais projet
- ❌ Skipper le typecheck/lint après install → potentielle drift de version
