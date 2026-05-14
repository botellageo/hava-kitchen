---
name: audit
description: 'Audit post-itération — 3 agents spécialisés par type de bug (Crashes/Sécurité/Qualité) + vérificateur anti-hallucination. USE WHEN: audit, audite, check the code, review iteration, vérifie le code.'
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash, Write, Edit, Agent, TodoWrite
---

# Audit — Post-itération (stratégie Anthropic)

Agents spécialisés par TYPE DE BUG + vérificateur anti-hallucination.
Nombre d'agents adapté au volume de fichiers modifiés.
Projet pms-midi5 (React 19 + TS strict + Firebase + Zod).

## Scaling dynamique

| Fichiers modifiés | Stratégie                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| 1-3 fichiers      | Passe 1 scripts + 1 agent unique (Crashes+Sécu+Qualité combiné, model sonnet)                            |
| 4-15 fichiers     | Passe 1 + 2 agents parallèles (Crashes+Sécu / Qualité, model sonnet) + 1 vérificateur (model opus)       |
| 16+ fichiers      | Passe 1 + 3 agents parallèles (Crashes / Sécurité / Qualité, model sonnet) + 1 vérificateur (model opus) |

## Trigger

"audit", "audite", "check the code", "review iteration", "vérifie le code"

## Passe 1 — Scripts automatiques

1. Lire `docs/todo.md` (si présent) → identifier les fichiers de l'itération, sinon `git diff --name-only main`
2. Compter les lignes (`wc -l`)
3. `npx tsc -b --noEmit` (TS strict)
4. `npx eslint . --max-warnings=0`
5. `npx prettier --check "src/**/*.{ts,tsx,css,json}"`
6. (Si tests présents) `npm test`
7. Scan secrets + imports interdits
8. Check rules Firestore : pas de `allow ... if true`
9. Check immutabilité HACCP : collections `releves_*`, `tracabilite_*`, `non_conformites` doivent avoir `allow update, delete: if false;`

## Passe 2 — 3 agents parallèles (run_in_background: true)

Chaque agent lit EN ENTIER les fichiers de l'itération. Scopes STRICTEMENT séparés, AUCUN chevauchement.

### Agent CRASHES (uniquement ce qui fait crasher l'app ou perd des données)

```
Tu cherches UNIQUEMENT les bugs qui provoquent un CRASH ou une PERTE DE DONNÉES.
Tu ne cherches PAS les problèmes de qualité, style, ou sécurité.

ANTI-HALLUCINATION : AVANT de remonter un finding, RELIS le fichier et VÉRIFIE que le code exact que tu cites est bien à la ligne indiquée. Si ce n'est pas le cas → SUPPRIME le finding.

Fichiers: [liste]

CHERCHE UNIQUEMENT :
- Lecture Firestore avec snap.data() au lieu de parseDoc/tryParseDoc → crash sur schema drift
- Écriture Firestore SANS validation Zod préalable de l'input utilisateur
- Nouveau champ Zod SANS .default() ou .optional() sur des docs déjà en base
- useEffect créant un listener (onSnapshot) SANS return unsubscribe → leak + crash
- useEffect async sans cleanup / isMounted guard → setState après unmount
- Bang operator (!) sur valeur potentiellement null/undefined sans check préalable
- Accès array[index] sans bounds check sur tableau de taille variable
- Timestamp Firestore traité comme Date sans .toDate()
- try/catch manquant autour d'un appel httpsCallable / getDoc / setDoc qui peut throw
- Promise non awaitée sur une mutation Firestore critique
- useState initialisé avec une valeur lue de localStorage sans try/catch JSON.parse
- Type assertion `as` masquant un null possible
- Composant qui throw dans le render sans ErrorBoundary parent visible

FORMAT : [fichier:ligne] `code exact` — description crash potentiel
Maximum 15 findings. Pas de prose.
```

### Agent SÉCURITÉ (uniquement ce qui est dangereux)

```
Tu cherches UNIQUEMENT les vulnérabilités de sécurité.
Tu ne cherches PAS les bugs, la qualité, ou le style.

ANTI-HALLUCINATION : RELIS le fichier et VÉRIFIE le code exact avant de remonter.

Fichiers: [liste]

CHERCHE UNIQUEMENT :
- Credentials en dur : private_key, serviceAccount, API tokens (sk_live_, sk-, ghp_, glpat-, AKIA), passwords hardcodés, AIzaSy[33 chars] (sauf si c'est l'apiKey Firebase publique dans env)
- Cloud Function callable SANS vérification request.auth (https.onCall)
- Cloud Function HTTP SANS vérification token (https.onRequest)
- Firestore Rule avec allow write: if true ou allow read: if true sur des collections sensibles
- Collection HACCP (releves_*, tracabilite_*, non_conformites) SANS allow update, delete: if false;
- PII loggés : console.log/error contenant email, uid, nom, téléphone
- Import direct firebase/firestore en dehors de src/lib/ → contournement de la couche d'accès
- Données sensibles stockées en localStorage en clair (token, password)
- XSS potentiel : dangerouslySetInnerHTML
- Écriture Firestore d'un objet contenant directement un input utilisateur sans validation Zod
- URL Firebase Storage non vérifiée (downloadURL sans auth check)
- .env, .env.local, serviceAccountKey.json commités

FORMAT : [fichier:ligne] `code exact` — description risque sécurité
Maximum 10 findings.
```

### Agent QUALITÉ (uniquement ce qui dégrade la maintenabilité)

```
Tu cherches UNIQUEMENT les problèmes de qualité et maintenabilité.
Tu ne cherches PAS les crashes, la sécurité, ni les recommandations fonctionnelles.

ANTI-HALLUCINATION : RELIS le fichier et VÉRIFIE le code exact avant de remonter.

Fichiers: [liste]

CHERCHE UNIQUEMENT :
- Composant > 200 lignes (devrait être découpé en sous-composants)
- Fichier > 300 lignes
- Hook custom > 100 lignes (extraire helpers)
- Logique métier (calcul, transformation) directement dans JSX au lieu d'un hook/util
- map/filter/sort dans le JSX sur une collection potentiellement > 50 éléments
- useEffect avec deps array incomplet
- Type any explicite hors d'un cast contrôlé documenté
- Code copié-collé > 10 lignes identiques entre 2 fichiers (cite les 2)
- Nommage non descriptif (x, temp, data, result sans contexte)
- useState pour de la donnée serveur (devrait être hook Firestore avec onSnapshot)
- console.log en prod (sans eslint-disable explicite)
- Tailwind classes en dur répétées 3+ fois (extraire en composant ou cn helper)
- Schema Zod défini inline dans un composant au lieu de src/lib/schemas/
- Date stockée en string ISO au lieu de Timestamp Firestore

FORMAT : [fichier:ligne] `code exact` — description problème qualité
Maximum 10 findings.
```

## Passe 3 — Vérificateur (1 agent, après les 3)

```
Tu es un vérificateur de findings de code review. Tu élimines les faux positifs.
Projet : pms-midi5 (React 19 + TS strict + Firebase + Zod).

Findings des agents :
[coller tous les findings]

Pour CHAQUE finding :
1. LIS le fichier cité à la ligne indiquée
2. Le code cité correspond-il EXACTEMENT à ce qui est dans le fichier ?
3. Le problème décrit est-il RÉEL vu le contexte du code autour ?
4. La classification est-elle correcte ?

Faux positifs COURANTS à détecter :
- "snap.data() direct" → mais c'est dans parseDoc() lui-même (légitime, c'est l'implémentation)
- "useEffect sans cleanup" → mais le useEffect ne crée pas de listener (juste un fetch one-shot)
- "credentials trouvés" → c'est VITE_FIREBASE_API_KEY qui est PUBLIQUE par design (apiKey Firebase Web)
- "Cloud Function sans auth" → c'est un onSchedule / Firestore trigger (pas une callable)
- "any explicite" → c'est dans un type guard contrôlé avec runtime check
- "console.log" → c'est commenté ou dans __tests__ ou en eslint-disable
- "deps array incomplet" → c'est intentionnel avec une ref stable
- "allow if true" → c'est dans /emulator/* ou dans un mock, pas en prod
- "Schema sans .optional()" → le champ est garanti côté write par la rule

Retourne :
✅ CONFIRMÉ [fichier:ligne] BLOQUANT|WARNING — description
❌ FAUX POSITIF — raison

Décompte final : X BLOQUANT, Y WARNING, Z éliminés
```

## Passe 4 — Verdict

Écrire dans `docs/audit_history.md` (append, créer si absent) :

```
## Audit #[N] — [DATE] — Itération [N] : [Titre]
### Résultat: [PASS/FAIL] Grade [A/A-/B+/B/B-/C]

### Fichiers audités
[Table fichier | lignes]

### Passe 1 (scripts)
- Typecheck: ✅/❌
- ESLint: ✅/❌
- Prettier: ✅/❌
- Secrets: ✅/❌
- Rules HACCP immutables: ✅/❌

### Findings confirmés
#### BLOQUANT
#### WARNING

### Faux positifs éliminés (passe 3)
[Liste des findings rejetés avec raison]

### Verdict
A: 0 BLOQUANT, ≤2 WARNING | A-: 0 BLOQUANT, ≤5 WARNING
B+: 0 BLOQUANT, ≤8 WARNING | B: 0 BLOQUANT, >8 WARNING
C: ≥1 BLOQUANT
```

Mettre à jour `docs/memory.md` et `CLAUDE.md` (section État actuel).

## Passe 5 — Chaînage deploy (auto)

Si VERDICT = ✅ PASS (A ou A-) ET des fichiers `src/`, `firestore.rules`, ou `functions/` ont été modifiés → proposer `/deploy-firebase`.
