---
name: feature
description: 'Guided feature development — challenge 4 axes + plan step-by-step + /review intégré. USE WHEN: feature, nouvelle feature, développe, implémente, build, construis, code cette feature, /feature.'
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
argument-hint: [description courte de la feature]
---

# /feature — Développement guidé de feature

> Workflow complet : Spec → Challenge → Plan → Exécution step-by-step avec `/review` entre chaque commit.
> Solo dev Geoffrey, projet pms-midi5 (Vite + React 19 + TS strict + Firebase + Zod).

---

## Phase 1 — Comprendre le scope

### Lire les rules/docs pertinents (dans cet ordre)

1. `CLAUDE.md` — section "Domaine HACCP" + "Garde-fous solo dev"
2. `.claude/rules/haccp-domain.md` — vocabulaire métier
3. `.claude/rules/react-conventions.md` — patterns React/TS
4. `.claude/rules/firebase-conventions.md` — collections, DTO Zod
5. `.claude/rules/security.md` — règles immutabilité HACCP

### Poser les questions de cadrage (AskUserQuestion)

Avant tout, comprendre :

- **Quoi** : que fait cette feature exactement ?
- **Où** : quelle(s) route(s)/écran(s) sont concernés ?
- **Data** : quelles collections Firestore, quelles CF ? Une **nouvelle collection** = nouveau schéma Zod + nouvelles rules.
- **HACCP-critique ?** : si la donnée a valeur de preuve sanitaire → immutabilité requise (`allow update, delete: if false`)
- **Existant** : modifier un écran existant ou en créer un nouveau ?

**NE PAS passer à Phase 2 tant que le scope n'est pas clair.**

---

## Phase 2 — Challenge 4 axes

### RÈGLE ABSOLUE : PRÉSENTER, NE PAS DÉCIDER

Le challenge **présente les questions et risques** à Geoffrey. Claude ne tranche PAS les choix métier ou architecture. Il pose les bonnes questions. Geoffrey décide.

Aucune décision métier automatique. Aucune recommandation fonctionnelle.

### Présenter la grille de challenge

```
═══════════════════════════════════════════════
  CHALLENGE — [Nom de la feature]
═══════════════════════════════════════════════

🏗️ ARCHITECTURE
- [ ] Page ou composant réutilisable ? → Placement src/pages/ ou src/components/ ?
- [ ] Hook custom nécessaire ? Quelle logique extraire dans src/hooks/ ?
- [ ] Risque de prop drilling au-delà de 2 niveaux ? → Context ?
- [ ] Taille estimée : risque de dépasser 200 lignes ? → Découper ?
- [ ] Composants existants réutilisables ? (vérifier src/components/)

📊 DATA
- [ ] Path Firestore exact ? Nouvelle collection ?
- [ ] Schéma Zod créé dans src/lib/schemas/ ?
- [ ] Lecture temps réel (onSnapshot) ou ponctuelle (getDocs/getDoc) ?
- [ ] Index composite Firestore nécessaire ? Lequel ?
- [ ] Custom Claims requis (role) ? Sont-ils présents après login ?
- [ ] Que se passe-t-il si la query échoue ? Si la collection est vide ?
- [ ] Cloud Function à appeler ? Input/output attendu ?

🔒 SÉCURITÉ
- [ ] Auth check (auth.currentUser) avant opération sensible ?
- [ ] Inputs utilisateur validés via Zod avant écriture Firestore ?
- [ ] Firebase accédé via src/lib/firebase.ts uniquement (jamais d'init parallèle) ?
- [ ] Security Rule créée/mise à jour pour cette collection ?
- [ ] Si donnée HACCP critique : allow update, delete: if false; bien posé ?
- [ ] Pas de dangerouslySetInnerHTML ?

🖥️ UX
- [ ] Loading state pour chaque appel async ?
- [ ] État vide : que voit l'utilisateur avec 0 données ?
- [ ] Message de succès après mutation (toast/alert) ?
- [ ] Message d'erreur si échec (lisible, pas technique — JB n'est pas dev) ?
- [ ] Responsive : tablette en cuisine = priorité (Tailwind md: breakpoints) ?

═══════════════════════════════════════════════
```

### Attendre validation

Présenter la grille remplie avec les questions spécifiques à la feature.
Geoffrey valide chaque point ou répond aux questions.
Si un point est flou → AskUserQuestion.

**NE PAS passer à Phase 3 tant que le challenge n'est pas validé.**

---

## Phase 3 — Plan d'implémentation

### Écrire `docs/feature_plan.md`

```markdown
# Feature Plan — [Titre]

> Date: [YYYY-MM-DD] | Dev: Geoffrey | Statut: **EN COURS**

## Scope

[1-3 phrases décrivant la feature]

## Challenge (validé)

[Résumé des décisions prises en Phase 2]

## Step 1 — [Titre court]

**Commit** : `feat(scope): [description]`
**Fichiers** :

- CREATE `src/lib/schemas/<collection>.ts`
- CREATE `src/hooks/useXxx.ts`
- MODIFY `firestore.rules`

**Code** :
[Code exact avec imports — PAS de pseudo-code]

**Validation** : [Comment vérifier que ce step marche]
**Après** : → `/review` → commit

## Step 2 — [Titre court]

...

## Step N — Finalisation

**Après** : → `/audit` → `/update-docs` → push → merge main

## Notes

[Dépendances, blockers, questions]
```

### Contraintes du plan

- Chaque step = **max 5 fichiers** (sweet spot `/review`)
- Chaque step = **un commit** avec message pré-écrit (convention `feat|fix|chore(scope): desc`)
- Code = **exact avec imports** (pas de pseudo-code, pas de "...")
- Steps ordonnés par **dépendance** (schema Zod avant hook, hook avant page)
- Patterns `react-conventions.md` **enforced** dans chaque snippet
- Toute nouvelle collection → **schéma Zod + rule + parseDoc obligatoire**

### Présenter le plan

Afficher le plan complet. Attendre validation avant d'exécuter.

---

## Phase 4 — Exécution guidée

### Déroulement step-by-step

Pour chaque step du plan :

1. **Annoncer** : "Step N — [description]. Fichiers : [liste]. Je code."
2. **Implémenter** : Claude Code crée/modifie les fichiers
3. **Suggérer** : "→ Lance `/review` pour vérifier avant commit."
4. **Attendre** : Geoffrey lance `/review` et corrige si besoin
5. **Commit** : "→ Commit : `git commit -m 'feat(scope): ...'`"
6. **Marquer** : TodoWrite → step complété
7. **Passer** au step suivant

### Tracking progression (TodoWrite)

Créer un todo par step. Marquer in_progress puis completed au fur et à mesure.

### Fin de feature

Quand tous les steps sont complétés :

```
═══════════════════════════════════════════════
  ✅ FEATURE COMPLÈTE — [Nom]
═══════════════════════════════════════════════

  Steps : [N]/[N] complétés
  Commits : [liste des commits]

  Prochaines étapes :
  1. /audit          → vérification complète post-feature
  2. /update-docs    → synchroniser la documentation
  3. /deploy-firebase (si audit PASS)
  4. git push -u origin feat/[branch] → merge main
═══════════════════════════════════════════════
```

---

## Exemples d'application HACCP

- **Module relevés de température** : nouvelle collection `releves_temperature` (déjà créée dans les rules) → schéma Zod (equipement, valeur, datetime, opérateur) → hook `useReleveTemperature` (onSnapshot filtré par jour) → page `RelevesPage` + formulaire `AddReleveModal`.
- **Plan de nettoyage** : nouvelle collection `nettoyages` → schéma Zod (zone, fréquence, produit, status) → hook `useNettoyages` → page tableau hebdo avec cases à cocher.
- **Traçabilité produits** : collection `lots` → schéma Zod (DLC, lot, origine, dateReception) → scan code-barres ou saisie manuelle.

---

## Anti-hallucination

1. **TOUJOURS lire le fichier** avant de le modifier
2. **NE JAMAIS inventer** de paths Firestore — vérifier dans les rules existantes
3. **NE JAMAIS ajouter** de features non demandées (pas de scope creep)
4. **Code exact** avec tous les imports nécessaires
5. **Si incertain** sur structure Firebase → LIRE `firestore.rules` et `src/lib/firestore.ts`
6. **NE JAMAIS** faire de recommandation métier ou fonctionnelle
7. **NE JAMAIS** décider à la place de Geoffrey dans le challenge

## Règles absolues

- Phase 2 (challenge) **OBLIGATOIRE** avant tout code — même pour "un petit truc rapide"
- Un step = **max 5 fichiers**
- `/review` **OBLIGATOIRE** entre chaque step
- Commit message **pré-écrit** dans le plan
- Firebase via `src/lib/firebase.ts` **uniquement** (jamais d'init parallèle)
- Lecture Firestore via `parseDoc()` / `tryParseDoc()` **uniquement**
- Pas de `console.log` en prod
- Pas de `dangerouslySetInnerHTML`
- Pour donnée HACCP critique : **immutabilité** dans les rules
