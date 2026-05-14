---
name: deep-audit
description: 'Audit complet du projet entier — 3 agents sonnet par type de bug + vérificateur opus. Avant MEP ou tous les 10 itérations. USE WHEN: deep audit, audit complet, full audit, avant MEP.'
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent, TodoWrite
---

# Deep Audit — Audit complet du projet entier

Analyse TOUT le codebase pms-midi5. 3 agents sonnet par type de bug + 1 vérificateur opus. Avant MEP ou tous les 10 itérations.

## Model tiering

- Agents Crashes/Sécurité/Qualité → model **sonnet** (rapide, précis)
- Agent Vérificateur → model **opus** (raisonnement profond, détecte les faux positifs subtils)

## Trigger

"deep audit", "audit complet", "audit total", "full audit", "audit projet", "avant MEP", "/deep-audit"

## Passe 1 — Inventaire + scripts

```bash
# Métriques projet
echo "=== SRC ===" && find src -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
echo "=== FUNCTIONS ===" && find functions/src -type f -name '*.ts' 2>/dev/null | wc -l
echo "=== SCHEMAS ===" && find src/lib/schemas -type f -name '*.ts' 2>/dev/null | wc -l
echo "=== TESTS ===" && find src -name '*.test.ts' -o -name '*.test.tsx' 2>/dev/null | wc -l

# Typecheck + lint + tests
npx tsc -b --noEmit
npx eslint . --max-warnings=0
npx prettier --check "src/**/*.{ts,tsx,css,json}"

# Build prod
npm run build

# Scan complet
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -exec wc -l {} + | awk '$1 > 300' | sort -rn
grep -rnE 'private_key|serviceAccount|FIREBASE_TOKEN|sk_live_|AKIA' . --include='*.ts' --include='*.tsx' --include='*.js' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.husky
grep -rn "from 'firebase/" src/ --include='*.ts' --include='*.tsx' | grep -v 'src/lib/'
grep -rn 'snap\.data()' src/ --include='*.ts' --include='*.tsx' | grep -v 'src/lib/firestore.ts'

# Rules
grep -nE 'allow (read|write|create|update|delete)\s*:\s*if\s+true\s*;' firestore.rules
grep -c 'allow update, delete: if false' firestore.rules
```

## Passe 2 — 3 agents parallèles par TYPE DE BUG (tout le code)

### Agent CRASHES

```
Tu audites TOUT le codebase pms-midi5 pour trouver les bugs qui CRASHENT l'app.
Lis les fichiers dans src/, functions/src/.
Tu ne cherches PAS la sécurité ni la qualité.

ANTI-HALLUCINATION : RELIS chaque ligne citée. Si le code ne correspond pas → SUPPRIME.

CHERCHE :
- Lecture Firestore avec snap.data() au lieu de parseDoc/tryParseDoc
- Écriture Firestore SANS validation Zod préalable
- Schema Zod sans .default() ou .optional() sur champ ajouté tardivement
- useEffect onSnapshot SANS return unsubscribe
- useEffect async SANS isMounted guard ou AbortController
- Bang ! sur valeur potentiellement null
- Accès array[i] sans bounds check sur tableau variable
- Timestamp Firestore non converti via .toDate()
- try/catch manquant sur httpsCallable, getDoc, setDoc, updateDoc
- Promise non awaitée sur mutation critique
- localStorage JSON.parse sans try/catch
- Composant pouvant throw sans ErrorBoundary parent

FORMAT : [fichier:ligne] `code exact` — crash potentiel
Maximum 25 findings.
```

### Agent SÉCURITÉ

```
Tu audites TOUT le codebase pms-midi5 pour les vulnérabilités de sécurité.
Tu ne cherches PAS les crashes ni la qualité.

ANTI-HALLUCINATION : RELIS chaque ligne citée. Si le code ne correspond pas → SUPPRIME.

CHERCHE :
- Credentials en dur (private_key, sk_live_, sk-, ghp_, AKIA, tokens, passwords)
- Cloud Function callable sans request.auth
- Firestore Rule allow ... if true
- Collection HACCP (releves_*, tracabilite_*, non_conformites) sans allow update, delete: if false;
- PII dans console.log/error (email, uid, nom, téléphone)
- Import firebase/firestore direct hors src/lib/
- localStorage de données sensibles en clair
- dangerouslySetInnerHTML
- Écriture Firestore d'input utilisateur sans validation Zod
- .env, .env.local, serviceAccountKey.json commités

FORMAT : [fichier:ligne] `code exact` — risque sécurité
Maximum 15 findings.
```

### Agent QUALITÉ

```
Tu audites TOUT le codebase pms-midi5 pour les problèmes de maintenabilité.
Tu ne cherches PAS les crashes ni la sécurité.
Tu NE PROPOSES PAS de fonctionnalités.

ANTI-HALLUCINATION : RELIS chaque ligne citée. Si le code ne correspond pas → SUPPRIME.

CHERCHE :
- Composant > 200 lignes
- Fichier > 300 lignes
- Hook > 100 lignes
- Logique métier dans JSX au lieu de hook
- map/filter/sort dans JSX sur collection > 50 éléments potentiels
- useEffect deps array incomplet
- any explicite non documenté
- Code dupliqué > 10 lignes entre fichiers (cite les 2)
- Nommage non descriptif
- useState pour donnée serveur (devrait être hook Firestore)
- console.log en prod sans eslint-disable
- Tailwind classes en dur répétées 3+ fois
- Schema Zod inline au lieu de src/lib/schemas/
- Date stockée en string ISO au lieu de Timestamp

FORMAT : [fichier:ligne] `code exact` — problème qualité
Maximum 20 findings.
```

## Passe 3 — Vérificateur

Même agent vérificateur que `/audit` (model opus) : relit chaque finding, élimine les faux positifs.

## Passe 4 — Rapport

Écrire dans `docs/deep_audit_[date].md` :

```
# Deep Audit — [DATE]

## Métriques
| Couche | Fichiers | Lignes | Tests |
|--------|----------|--------|-------|
| src/   |          |        |       |
| functions/ |      |        |       |
| schemas/ |        |        |       |

## Scripts
| Check | Résultat |
|-------|----------|
| Typecheck | ✅/❌ |
| ESLint | ✅/❌ |
| Prettier | ✅/❌ |
| Build | ✅/❌ |
| Secrets | ✅/❌ |
| Imports firebase contournés | 0/N |
| snap.data() direct hors lib | 0/N |
| Rules `allow ... if true` | 0/N |
| Collections HACCP immutables | N/N |

## Findings confirmés (après vérification)
### Crashes (X confirmés / Y remontés)
### Sécurité (X confirmés / Y remontés)
### Qualité (X confirmés / Y remontés)

## Faux positifs éliminés
[Liste avec raison]

## Dette technique
[Top 10 fichiers les plus gros]
[Patterns récurrents]

## Top 5 actions prioritaires
1. ...

## Grade global
A/A-/B+/B/B-/C (même barème que /audit)
```

## Règles

- Durée : 10-20 min
- Max 1 fois par mois ou avant MEP
- Les agents lisent TOUT, pas juste le diff
- La vérification ÉLIMINE les faux positifs
- Pas de recommandation fonctionnelle — JAMAIS
