---
name: retrospective
description: Generates a retrospective analysis of the last N iterations. Identifies recurring findings, file hotspots, size trends, and actionable improvements. USE WHEN user says "retrospective", "rétro", "analyse des dernières itérations", "tendances", "what patterns do we see", or every 10 iterations to detect drift.
disable-model-invocation: false
allowed-tools: Read, Grep, Glob, Bash, TodoWrite
argument-hint: [nombre d'itérations à analyser, défaut 10]
---

# Rétrospective — pms-midi5

Analyse les N dernières itérations pour détecter patterns, tendances et axes d'amélioration.

## Sources

1. `docs/audit_history.md` — audits détaillés
2. `docs/memory.md` — phases et décisions
3. `CLAUDE.md` — exceptions de taille fichiers, état actuel
4. `git log --oneline` — pour cross-check

## Analyse (dans cet ordre)

### 1. Extraction des données

Pour les N derniers audits (défaut: 10), extraire :

- Grade (A/A-/B+/B/B-/C)
- Nombre de fichiers modifiés
- Nombre de findings par sévérité (BLOQUANT / WARNING)
- Catégorie (Crashes / Sécurité / Qualité)
- Fichiers touchés
- Faux positifs éliminés

### 2. Findings récurrents

Classer les findings par catégorie :

- **Architecture** : composants > 200L, hooks > 100L, logique dans JSX
- **Sécurité** : credentials, PII en log, rules trop permissives, immutabilité HACCP oubliée
- **Qualité** : any, nommage, code dupliqué, console.log
- **Firestore** : snap.data() direct, schéma Zod oublié, import firebase hors lib/
- **HACCP** : violation immutabilité, donnée critique sans rule, valeurs hors seuil non gérées

Identifier les findings qui reviennent sur 2+ itérations → pattern à corriger.

### 3. Fichiers hotspots

Identifier les fichiers modifiés dans 3+ itérations → candidats à refactoring.
Pour chaque hotspot :

- Nombre d'itérations touchées
- Tendance de taille (croissante ?)
- Nature des modifications (features vs fixes)

### 4. Tendance taille fichiers

Pour les fichiers dans les exceptions CLAUDE.md :

- Évolution de la taille sur les N dernières itérations
- Alerte si croissance > 10% sur la période
- Recommandation d'extraction si applicable

### 5. Schémas Zod & Rules

- Nombre de collections Firestore créées
- Toutes ont un schéma Zod ?
- Toutes ont une rule explicite (pas de match catch-all) ?
- Collections HACCP : toutes immutables ?

## Format de sortie

```
═══════════════════════════════════════
  RÉTROSPECTIVE — It.[X] → It.[Y]
═══════════════════════════════════════

📊 RÉSUMÉ
  Itérations analysées : [N]
  Grades : [X]×A, [Y]×B, [Z]×C
  Findings totaux : [N] (BLOQUANT:[X] WARNING:[Y])
  Faux positifs éliminés : [Z]

🔄 PATTERNS RÉCURRENTS
  1. [Pattern] — vu dans It.[X], [Y], [Z]
     → Action recommandée : [...]
  2. [Pattern] — ...

🔥 FICHIERS HOTSPOTS
  1. [fichier] — modifié [N] fois, [X]→[Y] lignes (+Z%)
     → [Recommandation]

📈 TENDANCE TAILLE
  [fichier1]: [X] → [Y] lignes (+Z%)
  [fichier2]: [X] → [Y] lignes (+Z%)

🔥 FIREBASE
  Collections totales      : [N]
  Schémas Zod              : [N]/[N]
  Rules explicites         : [N]/[N]
  Collections HACCP immut. : [N]/[N]

💡 TOP 3 ACTIONS
  1. [Action prioritaire]
  2. [Action]
  3. [Action]
═══════════════════════════════════════
```

## Règles

- Être factuel — pas de spéculations, uniquement des données des audits
- Les recommandations doivent être spécifiques et actionnables
- Comparer avec les règles d'or de CLAUDE.md pour voir si elles sont respectées
- Si un pattern est résolu, le noter comme tel
