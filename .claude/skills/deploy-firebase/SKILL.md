---
name: deploy-firebase
description: 'Déploiement manuel sur Firebase (Hosting + Rules + Functions) pour le projet hava-kitchen. Propose les étapes après un /audit PASS. USE WHEN: deploy, déploie, met en ligne, firebase deploy, /deploy-firebase.'
disable-model-invocation: false
allowed-tools: Bash, AskUserQuestion
argument-hint: [hosting | rules | functions | all]
---

# Deploy Firebase — Mise en ligne de pms-midi5

> Se déclenche après un `/audit` PASS si des fichiers `src/`, `firestore.rules` ou `functions/` ont été modifiés.
> Peut aussi être lancé manuellement avec `/deploy-firebase`.

## Projet cible

**Firebase Project** : `hava-kitchen` (production)
**URL Hosting** : `https://hava-kitchen.web.app` (ou domaine custom)

## Étape 1 — Identifier ce qui doit être déployé

Vérifier les fichiers modifiés depuis le dernier deploy :

```bash
# Détection auto
git diff --name-only origin/main..HEAD
```

| Modification                                                   | Cible deploy        |
| -------------------------------------------------------------- | ------------------- |
| `src/**`, `index.html`, `vite.config.ts`, `tailwind.config.js` | `hosting`           |
| `firestore.rules`                                              | `firestore:rules`   |
| `firestore.indexes.json`                                       | `firestore:indexes` |
| `storage.rules`                                                | `storage`           |
| `functions/**`                                                 | `functions`         |

## Étape 2 — Demander confirmation

Utiliser AskUserQuestion :

```
🚀 Modifications détectées :
   - Hosting    : [oui/non]
   - Rules      : [oui/non]
   - Indexes    : [oui/non]
   - Functions  : [oui/non]

   On déploie sur hava-kitchen (PROD) ?
   - Oui tout
   - Sélectif (préciser)
   - Non, je le ferai plus tard
```

**JAMAIS de déploiement automatique** sans confirmation explicite de Geoffrey.

## Étape 3 — Build (si hosting)

```bash
npm run build
```

**Ce que ça fait** : typecheck + build Vite. Le résultat est dans `dist/`.
Si erreur TS ou build → afficher en langage simple et STOP.

## Étape 4 — Déployer

### Tout déployer

```bash
firebase deploy -P hava-kitchen
```

### Cibles sélectives

```bash
# Hosting uniquement
firebase deploy --only hosting -P hava-kitchen

# Rules uniquement
firebase deploy --only firestore:rules -P hava-kitchen

# Indexes uniquement
firebase deploy --only firestore:indexes -P hava-kitchen

# Functions uniquement (build TS d'abord)
cd functions && npm run build && cd .. && firebase deploy --only functions -P hava-kitchen
```

## Étape 5 — Confirmation

```
✅ Déployé sur hava-kitchen
   Hosting   : https://hava-kitchen.web.app
   Rules     : firestore.rules version [N]
   Functions : [liste des CF déployées]

   Vérifie en prod et rollback avec :
   firebase hosting:rollback -P hava-kitchen   (hosting only)
```

## Règles

- JAMAIS de déploiement automatique → toujours demander confirmation
- TOUJOURS lancer `npm run build` avant un deploy hosting (le build inclut le typecheck strict)
- Si le build échoue → STOP, montrer l'erreur en langage simple
- Si Firebase demande une authentification → guider étape par étape (`firebase login`)
- Pour les Rules : prévenir Geoffrey que les changements sont **immédiats** en prod
- Pour les Functions : prévenir si la première exécution peut prendre du temps (cold start)
- Pour les changements de schéma HACCP : **toujours** vérifier que `allow update, delete: if false` est toujours présent sur les collections critiques avant deploy rules

## Garde-fous critiques avant deploy Rules

Avant tout `firebase deploy --only firestore:rules`, exécuter :

```bash
# Pas de allow if true en prod
grep -nE 'allow (read|write|create|update|delete)\s*:\s*if\s+true\s*;' firestore.rules && echo "❌ Trouvé allow ... if true" && exit 1

# Collections HACCP toujours immutables
for col in releves_temperature; do
  grep -A 5 "match /$col/" firestore.rules | grep -q "allow update, delete: if false" || echo "⚠️ $col n'a plus l'immutabilité"
done
```
