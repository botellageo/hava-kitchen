# PMS Midi 5

Plan de Maîtrise Sanitaire custom pour Midi 5 (JB).
Stack : Vite + React 18 + TypeScript strict + Firebase + Tailwind.

## 🛡️ Garde-fous solo dev

Ce projet est conçu pour un développement **solo** (sans review backend). Les protections suivantes sont actives par défaut :

| Garde-fou                                                | Comment ça te protège                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **TypeScript strict** (`noUncheckedIndexedAccess`, etc.) | Impossible d'accéder à un champ inexistant ou mal typé                            |
| **Zod** (`src/lib/schemas/`)                             | Chaque doc Firestore validé au runtime → tu vois immédiatement si un schéma drift |
| **`parseDoc()`** (`src/lib/firestore.ts`)                | Wrapper obligatoire pour lire un doc Firestore (throw si invalide)                |
| **ErrorBoundary global**                                 | Un bug local ne casse pas tout l'écran                                            |
| **Sentry** (free tier)                                   | Tu sais quand JB crashe sans qu'il t'appelle                                      |
| **ESLint + Prettier + Husky**                            | Impossible de committer du code cassé ou mal formaté                              |
| **Firestore Security Rules**                             | Auth obligatoire + relevés immutables (traçabilité HACCP)                         |
| **Firebase Emulator**                                    | Tu développes en local sans toucher la prod                                       |
| **CF backup quotidien**                                  | Sauvegarde Firestore chaque jour à 3h (Europe/Paris)                              |

## 🚀 Démarrage

### 1. Configurer les variables d'environnement

```bash
cp .env.example .env.local
# remplir avec ta config Firebase
```

### 2. Installer les dépendances

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Démarrer les Emulators (dans un terminal)

```bash
npm run emulators
# UI sur http://127.0.0.1:4000
```

### 4. Démarrer l'app (dans un autre terminal)

```bash
npm run dev
# avec VITE_USE_EMULATOR=true dans .env.local
```

## 📜 Scripts

```bash
npm run dev          # serveur de dev Vite
npm run build        # typecheck + build prod
npm run lint         # ESLint
npm run format       # Prettier --write
npm run typecheck    # tsc seul
npm run emulators    # Firebase Emulator Suite
```

## 📁 Structure

```
src/
├── lib/
│   ├── env.ts              ← validation Zod des env vars
│   ├── firebase.ts         ← config Firebase + switch Emulator
│   ├── firestore.ts        ← parseDoc() — lecture safe avec Zod
│   ├── sentry.ts           ← init Sentry
│   └── schemas/            ← un fichier Zod par collection Firestore
├── components/
│   └── ErrorBoundary.tsx   ← attrape les crashs React + envoie à Sentry
├── pages/                  ← écrans (routes)
├── hooks/                  ← hooks Firestore custom (onSnapshot + Zod)
├── App.tsx                 ← routing
└── main.tsx                ← entrée React (init Sentry, ErrorBoundary, Router)

functions/
└── src/
    └── index.ts            ← Cloud Functions (backup quotidien Firestore)

firestore.rules             ← Security Rules
firebase.json               ← config Firebase (hosting, emulator, rules)
```

## 🔑 Règles d'or solo dev

1. **Toujours typer les docs Firestore avec un schéma Zod**
   → créer `src/lib/schemas/<collection>.ts` pour chaque collection
2. **Toujours lire avec `parseDoc()` ou `tryParseDoc()`**, jamais `snap.data()` directement
3. **Toujours ajouter une Security Rule** pour chaque nouvelle collection
4. **Tester en Emulator avant de toucher la prod** (`VITE_USE_EMULATOR=true`)
5. **Ne jamais committer `.env.local`** (le `.gitignore` est déjà configuré)
6. **Pour les données HACCP critiques** : `allow update, delete: if false;` dans les rules
   → la traçabilité doit être immutable
