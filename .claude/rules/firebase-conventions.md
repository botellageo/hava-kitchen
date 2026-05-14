---
paths:
  - 'src/lib/firebase.ts'
  - 'src/lib/firestore.ts'
  - 'src/lib/schemas/**'
  - 'src/hooks/**'
  - 'functions/**'
  - 'firestore.rules'
  - 'firestore.indexes.json'
---

# Firebase & Firestore — pms-midi5

## Projet

- **Firebase Project** : `hava-kitchen`
- **Région** : `europe-west1` (à confirmer côté Functions)
- **Auth** : Email/password + Google (option) — `users/{uid}` stocke le role

## Conventions de nommage Firestore

### Collections principales (à compléter au fil des features)

| Collection              | Description                               | Access pattern                   |
| ----------------------- | ----------------------------------------- | -------------------------------- |
| `users`                 | Profils (Admin/Manager/Staff)             | owner read+write, admin read all |
| `organisations`         | Config restaurant (1 doc = Midi 5)        | staff read, admin write          |
| `releves_temperature`   | Relevés HACCP (équipement, valeur, temps) | staff create+read, **immutable** |
| `nettoyages` (TBD)      | Plan de nettoyage                         | staff RW                         |
| `lots` (TBD)            | Traçabilité produits                      | staff RW                         |
| `non_conformites` (TBD) | Écarts constatés HACCP                    | staff create+read, **immutable** |

### Convention de nommage des champs

**CRITIQUE** : les noms de champs Firestore sont **IMMUABLES** (rétrocompatibilité) — un rename casse les anciens docs.

- **camelCase partout** (ex: `createdAt`, `createdBy`, `displayName`, `temperatureValue`)
- Timestamps : suffixe `At` (createdAt, updatedAt)
- Foreign keys : suffixe `Id` (userId, equipementId)
- Booléens : préfixe `is`, `has` (isActive, hasAlert)

### DTO Pattern (Zod + parseDoc)

Toute lecture doit passer par un **schéma Zod** + **`parseDoc()`**. Jamais `snap.data()` direct.

```ts
// src/lib/schemas/releve_temperature.ts
import { z } from 'zod';
import { timestampSchema } from './common';

export const releveTemperatureSchema = z.object({
  equipement: z.string().min(1),
  temperature: z.number(),
  createdAt: timestampSchema, // Firestore Timestamp
  createdBy: z.string(), // uid
  notes: z.string().optional(),
});

export type ReleveTemperature = z.infer<typeof releveTemperatureSchema>;
```

```ts
// src/hooks/useRelevesTemperature.ts
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseDoc } from '@/lib/firestore';
import { releveTemperatureSchema } from '@/lib/schemas/releve_temperature';

export function useRelevesTemperature() {
  // ... onSnapshot → snapshot.docs.map(d => parseDoc(d, releveTemperatureSchema))
}
```

### Règle d'or écriture Firestore

Avant TOUT `setDoc`, `addDoc`, `updateDoc` :

```ts
// Valider l'input via Zod
const parsed = releveTemperatureSchema.parse(input);
// Puis écrire
await addDoc(collection(db, 'releves_temperature'), parsed);
```

## Firestore Rules

### Patterns standards

- **Default deny** : `match /{document=**} { allow read, write: if false; }`
- **Auth required** : `function isSignedIn() { return request.auth != null; }`
- **Owner pattern** : `request.auth.uid == resource.data.createdBy`
- **Role** : lookup `users/{uid}.role` via helper `isAdmin()`, `isStaff()`

### HACCP immutabilité (CRITIQUE)

Toute collection HACCP (relevés, traçabilité, non-conformités) DOIT avoir :

```js
match /releves_temperature/{releveId} {
  allow read: if isStaff();
  allow create: if isStaff()
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.keys().hasAll(['temperature', 'equipement', 'createdAt', 'createdBy']);
  allow update, delete: if false;   // IMMUTABLE — traçabilité légale
}
```

### Indexes composites

- Tout `orderBy` + `where` sur 2 champs → ajouter un index dans `firestore.indexes.json`
- Lancer `firebase deploy --only firestore:indexes` pour mettre à jour

## Cloud Functions

- **Runtime** : Node.js 20 (firebase-functions v6+)
- **Callables** (`https.onCall`) : TOUJOURS vérifier `request.auth` au début
- **Schedule** (`onSchedule`) : pour backup quotidien Firestore (3h Europe/Paris)
- **Firestore triggers** (`onDocumentCreated`) : pour alertes (ex: relevé > seuil)
- **Pas d'auth check requis** sur les triggers Firestore (pas d'utilisateur direct)

```ts
// Exemple callable avec auth check
export const exportPMS = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Auth requis');
  }
  // ...
});
```

## Emulator (dev)

- Lancer : `npm run emulators`
- UI : http://127.0.0.1:4000
- App pointe sur emulator si `VITE_USE_EMULATOR=true` dans `.env.local`
- **Toujours dev en emulator** avant de toucher la prod
