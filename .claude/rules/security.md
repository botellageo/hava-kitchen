---
paths: []
---

# Rules Sécurité — pms-midi5

## Règles absolues

- **JAMAIS de credentials** dans le code (private*key, tokens, passwords, sk_live*, sk-..., AKIA, ghp\_, glpat-)
- **serviceAccountKey.json** JAMAIS commité (vérifier .gitignore)
- **.env, .env.local** JAMAIS commités (sauf `.env.example`)
- **Pas de PII** dans les logs (`console.log/error` avec email, uid, nom, téléphone)
- **Cloud Functions callables** : vérifier `request.auth` sur TOUTES (pas optionnel)
- **Firestore Rules** : pas de `allow ... if true` en production
- **Firebase** accédé via `src/lib/firebase.ts` uniquement (jamais d'init parallèle)
- **Lecture Firestore** via `parseDoc()` / `tryParseDoc()` (jamais `snap.data()` direct hors `src/lib/`)
- **Écriture Firestore** : input utilisateur validé par Zod avant tout `addDoc`/`setDoc`/`updateDoc`
- **Pas de `dangerouslySetInnerHTML`** sauf cas justifié + sanitization explicite

## Clé Firebase publique (apiKey)

`VITE_FIREBASE_API_KEY` est **publique par design** (Firebase Web SDK).
La sécurité repose sur les **Firestore Rules**, pas sur la clé.
Cette clé peut donc être présente dans le bundle JS distribué — c'est attendu.

⚠️ La clé `AIzaSy...` détectée dans le bundle dist/ n'est PAS un secret. Ne pas la confondre avec un service account.

## HACCP : immutabilité légale

**Les relevés HACCP ont valeur de preuve sanitaire** en cas de contrôle DDPP (Direction Départementale de la Protection des Populations). Toute modification a posteriori = fraude potentielle.

### Règle Firestore obligatoire pour les collections HACCP

```js
allow update, delete: if false;
```

Collections concernées :

- `releves_temperature` ✅ (déjà en place)
- `nettoyages` (futur)
- `lots` / traçabilité (futur)
- `non_conformites` (futur)
- Tout audit / preuve règlementaire

### Si correction nécessaire

Pas de modification d'un relevé existant → **créer un nouveau relevé** marqué comme "correction" avec référence au précédent (`correctsId`). Le précédent reste en base, intact. Audit trail intégral.

## Stockage Firebase Storage

- Toute URL `downloadURL` accessible publiquement = risque d'exposition de PII (photos clients, factures fournisseurs, etc.)
- Pour les fichiers sensibles → Storage Rules avec `allow read: if isStaff()`
- Préférer `getDownloadURL` à l'appel + token court (pas de lien public)

## Variables d'environnement

| Variable                                    | Public ?      | Notes                                              |
| ------------------------------------------- | ------------- | -------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`                     | Oui (bundled) | Clé publique Firebase Web                          |
| `VITE_FIREBASE_*` (project, sender, app id) | Oui (bundled) | Config publique                                    |
| `VITE_SENTRY_DSN`                           | Oui (bundled) | DSN Sentry frontend (public)                       |
| `VITE_USE_EMULATOR`                         | Oui           | Flag local dev                                     |
| Toute autre clé serveur                     | NON           | Doit vivre dans `functions/.env` ou Secret Manager |

## Cloud Functions secrets

Pour les Functions, utiliser `firebase functions:secrets:set <NAME>` (Secret Manager GCP).
Jamais en clair dans le code, jamais dans `firebase functions:config:set` (déprécié).

## Voir aussi

- `.claude/rules/haccp-domain.md` — vocabulaire et règles métier HACCP
- `.claude/rules/firebase-conventions.md` — conventions Firestore complètes
