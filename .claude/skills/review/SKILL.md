---
name: review
description: 'Contrôle qualité avant commit — scripts + agent(s) adaptatif(s) anti-hallucination. USE WHEN: review, vérifie, check, prêt à push, prêt à commit, quality.'
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash, Agent, TodoWrite
---

# Review — Contrôle qualité avant commit

Scripts automatiques + agent(s) adaptatif(s). Projet pms-midi5 (Vite + React 19 + TS strict + Firebase + Zod).

## Scaling

- **1-5 fichiers** → 1 agent unique (sonnet) avec vérification intégrée
- **6-15 fichiers** → 2 agents (Crashes / Qualité+Sécu, sonnet) — pas de vérificateur (review = rapide)
- **16+ fichiers** → recommander `/audit` à la place

## Trigger

"review", "vérifie", "check", "prêt à push", "prêt à commit", "quality", "/review"

## Étape 1 — Scripts automatiques

### 1.1 Branche

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
```

❌ si `main` (commits doivent passer par feature branch).

### 1.2 Détecter les fichiers modifiés

```bash
git diff --name-only HEAD
git diff --cached --name-only
```

### 1.3 Checks projet

```bash
# TypeScript strict
npx tsc -b --noEmit

# ESLint
npx eslint . --max-warnings=0

# Prettier
npx prettier --check "src/**/*.{ts,tsx,css,json}"

# Build prod (optionnel mais conseillé sur gros changement)
# npm run build
```

### 1.4 Transverse

```bash
# Secrets (regex courantes)
git diff --cached | grep -iE 'private_key|serviceAccount|FIREBASE_TOKEN|sk_live_|sk-[a-zA-Z0-9]{20}|ghp_|glpat-|AKIA|client_secret|AIzaSy[A-Za-z0-9_-]{33}|-----BEGIN.*PRIVATE'

# Imports interdits
grep -rn 'console\.log' src/ --include='*.ts' --include='*.tsx' | grep -v '// eslint-disable' | grep -v '__tests__'
grep -rn 'dangerouslySetInnerHTML' src/ --include='*.tsx'

# Firebase doit passer par src/lib/firebase.ts
grep -rn "from 'firebase/" src/ --include='*.ts' --include='*.tsx' | grep -v 'src/lib/'

# Fichiers > 300 lignes (warning)
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -exec wc -l {} + | awk '$1 > 300' | sort -rn

# Rules Firestore : pas de allow ... if true
grep -nE 'allow (read|write|create|update|delete)\s*:\s*if\s+true\s*;' firestore.rules
```

Si un check échoue → afficher, proposer fix, STOP.

## Étape 2 — Agent review (1 agent, vérification intégrée)

Lister fichiers modifiés + dépendants 1 niveau. Lancer UN agent :

```
Tu es un reviewer de code pour pms-midi5 (PMS HACCP — React 19 + TS strict + Firebase + Zod).

RÈGLES ANTI-HALLUCINATION :
1. Tu NE PROPOSES PAS de nouvelles fonctionnalités
2. Tu NE FAIS PAS de recommandations métier ou réglementaires
3. AVANT de remonter un finding, RELIS la ligne citée dans le fichier
4. Si le code que tu cites ne correspond PAS exactement à ce que tu décris → SUPPRIME le finding
5. Si tu n'es pas sûr qu'un problème est réel → INFO, jamais BLOQUANT
6. Cite TOUJOURS le code exact entre backticks

Working directory: [racine projet]
Fichiers modifiés: [liste]

BLOQUANT (uniquement si CRASH, PERTE DE DONNÉES, ou VIOLATION HACCP confirmée) :
- Lecture Firestore SANS parseDoc/tryParseDoc → risque de schéma drift silencieux. VÉRIFIE qu'aucun snap.data() direct n'est utilisé.
- Écriture Firestore SANS validation Zod préalable sur l'input utilisateur.
- Nouveau champ dans un schéma Zod SANS default ou .optional() → risque crash sur docs existants.
- Cloud Function callable SANS vérification request.auth.
- Firestore Rule avec allow write: if true sur une collection.
- Collection HACCP (relevés, traçabilité, non-conformités) SANS allow update, delete: if false;
- Credentials/secrets dans le code (private_key, AIzaSy..., sk_live_, token hardcodé).
- useEffect créant un listener Firestore SANS return unsubscribe → leak mémoire.
- await dans un composant suivi d'un setState SANS guard isMounted/AbortController.
- Type any explicite hors d'un cast contrôlé (TS strict actif).
- dangerouslySetInnerHTML.

WARNING :
- console.log en prod
- useEffect deps array incomplet
- useEffect sans cleanup quand il crée un listener
- Composant > 200 lignes (devrait être découpé)
- Fichier > 300 lignes
- Hook custom > 100 lignes (extraire helpers)
- Logique métier dans le composant (devrait être dans hook)
- map/filter/sort dans le JSX sur > 50 éléments potentiels
- Tailwind class noire en dur (utiliser tokens du design system)
- Date stockée en string ISO au lieu de Timestamp Firestore
- Import direct de firebase/firestore hors src/lib/

FORMAT STRICT :
[fichier:ligne] BLOQUANT — `code exact cité` — explication 1 ligne
[fichier:ligne] WARNING — `code exact cité` — explication 1 ligne
ou : ✅ Aucun finding.
Maximum 15 findings. Pas de prose.
```

## Étape 3 — Verdict

```
══════════════════════════════════════
  REVIEW — [date] — [branche]
══════════════════════════════════════
  ✅/❌ Branche / Typecheck / Lint / Prettier / Secrets / Imports
  ⚠️ Fichiers > 300L: [liste ou aucun]
  Agent: [findings ou ✅]
  VERDICT: ✅ PRÊT / ❌ BLOQUÉ
  Message: feat(scope): description
══════════════════════════════════════
```
