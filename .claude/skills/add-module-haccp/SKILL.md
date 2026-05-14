---
name: add-module-haccp
description: Crée la structure de base d'un nouveau module HACCP (Zod schema + hook Firestore + Security Rule immutable + composant UI + test). À utiliser quand Geoffrey veut ajouter un nouveau type de relevé/document HACCP (plan de nettoyage, lots, non-conformités, formations, etc.) — équivalent métier HACCP du /add-releve d'aerotask.
---

# /add-module-haccp — Ajouter un module HACCP

> Bootstrap complet d'un nouveau module HACCP en respectant les garde-fous : schéma Zod, parseDoc, hook Firestore, Security Rule **immutable**, composant UI, test.

## Principe

Un "module HACCP" = une collection Firestore + son écran de saisie + son écran de consultation. Exemples :

- `nettoyages` — plan de nettoyage (zone, produit, opérateur, datetime)
- `lots` — traçabilité produit (référence, fournisseur, DLC, T° réception)
- `non_conformites` — écarts constatés + action corrective
- `formations` — sessions de formation hygiène du personnel
- `audits_internes` — auto-contrôles périodiques

## ⚠️ Anti-recommandations métier

- **NE PAS** proposer de logique métier HACCP (seuils, fréquences, obligations) → c'est à Geoffrey/JB de décider, pas à Claude
- **NE PAS** hardcoder de seuils ou règles réglementaires
- **NE PAS** imaginer des modules qui n'ont pas été demandés — exécuter strictement le brief

## Process — 6 steps

### Step 0 — Brief

Demander à Geoffrey :

1. **Nom du module** (ex: `nettoyages`) — sera le nom de la collection Firestore
2. **Champs métier** que doit contenir un enregistrement (label + type)
3. **Champs obligatoires** vs optionnels
4. **Qui peut créer** ? (Staff/Manager/Admin)
5. **Est-ce un module HACCP-critique ?** Si oui → immutable (`allow update,delete: if false`)
6. **Y a-t-il un seuil/contrôle automatique** ? (ex: temp > X → non-conformité) — peut-être un Cloud Function trigger

**Ne pas inventer.** Si un point est flou, demander avant de coder.

### Step 1 — Schéma Zod

Créer `src/lib/schemas/<module>.ts` avec :

```ts
import { z } from 'zod';
import { baseDocSchema, timestampSchema } from './common';

export const <Module>Schema = baseDocSchema.extend({
  // champs métier validés par Geoffrey à l'étape 0
  ...,
  createdBy: z.string().min(1),
});

export type <Module> = z.infer<typeof <Module>Schema>;
```

Ré-exporter depuis `src/lib/schemas/index.ts`.

### Step 2 — Security Rule

Éditer `firestore.rules` pour ajouter le bloc :

```js
match /<module>/{id} {
  allow read: if isStaff();
  allow create: if isStaff()
    && request.resource.data.createdBy == request.auth.uid
    && request.resource.data.keys().hasAll(['<champs_requis>', 'createdAt', 'createdBy']);

  // ⚠️ Si HACCP-critique (décision step 0) :
  allow update, delete: if false;

  // ⚠️ Sinon (si update toléré) : justifier explicitement dans CLAUDE.md
}
```

Si HACCP-critique → ajouter un test dans `src/test/rules/<module>.test.ts` (inspiré de `releves_temperature.test.ts`).

### Step 3 — Hook Firestore

Créer `src/hooks/use<Module>.ts` :

```ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { <Module>Schema, type <Module> } from '@/lib/schemas/<module>';

export function use<Modules>(maxItems = 100) {
  const [items, setItems] = useState<(<Module> & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, '<module>'),
      orderBy('createdAt', 'desc'),
      limit(maxItems),
    );
    const unsub = onSnapshot(q, (snap) => {
      const parsed = snap.docs
        .map((d) => tryParseDoc(d, <Module>Schema))
        .filter((x): x is <Module> & { id: string } => x !== null);
      setItems(parsed);
      setLoading(false);
    });
    return () => unsub();
  }, [maxItems]);

  return { items, loading };
}
```

### Step 4 — Composant UI (saisie + liste)

Créer `src/pages/<Module>Page.tsx` ou `src/components/<Module>Form.tsx` selon le brief.

Standards :

- Formulaire validé par le **même schéma Zod** (préférer `<Module>Schema.omit({ createdAt, updatedAt, createdBy }).parse(formData)`)
- Bouton submit qui fait `addDoc` avec `serverTimestamp()` (jamais l'heure client)
- État d'erreur affiché clairement (champ par champ si possible)
- Sur tablette de cuisine : champs gros, gestes rapides, feedback instantané
- Liste des items récents (utilise le hook step 3)

### Step 5 — Tests

Créer au minimum :

- `src/lib/schemas/<module>.test.ts` — validation Zod (cas OK, cas KO)
- `src/test/rules/<module>.test.ts` — si HACCP-critique, tester immutabilité (cf. exemple `releves_temperature`)
- Composant : test smoke (`renders without crashing`) + 1 test interactif (saisie OK)

Lance `npm test` et vérifie que tout passe.

### Step 6 — Doc + commit

- Mettre à jour `CLAUDE.md` section "Fichiers clés" si pertinent
- Suggérer à Geoffrey de lancer `/review` avant commit
- Commit message format :

```
Add: module HACCP <module>

- Schéma Zod (src/lib/schemas/<module>.ts)
- Security Rule (immutable: oui/non)
- Hook use<Modules> (onSnapshot + tryParseDoc)
- Composant <Module>Page / <Module>Form
- Tests : <résumé>
```

## Garde-fous à valider AVANT de finir le module

- [ ] Le schéma Zod existe et est utilisé partout (saisie ET lecture)
- [ ] La Security Rule existe avec le bon niveau d'immutabilité (HACCP → immutable obligatoire)
- [ ] Le hook utilise `tryParseDoc` (pas `snap.data()` direct)
- [ ] Les tests passent
- [ ] Le `npm run typecheck` passe (TS strict)
- [ ] L'ID auth est utilisé pour `createdBy` (pas un input user manipulable)
- [ ] `createdAt` = `serverTimestamp()` (jamais l'heure client)

Si une case n'est pas cochée → ne pas merger.

## Exemple complet

Voir comment a été setup `releves_temperature` (déjà en place) :

- Rule : `firestore.rules` lignes 38-49 (immutable, ✅ HACCP-critique)
- Test : `src/test/rules/releves_temperature.test.ts` (6 cas, immutabilité validée)
- Schéma Zod : à créer (Geoffrey n'a pas encore le hook/UI — c'est le premier module à finir)

Utilise ce module comme référence quand tu en ajoutes un nouveau.
