---
name: brief-status
description: Displays a quick summary of the pms-midi5 project. Current iteration, last audit grade, critical gaps, next steps. USE WHEN user says "brief", "status", "brief-status", "état du projet", "où en est-on", "résumé", "summary", or any request for a project overview.
allowed-tools: Read, Grep, Glob
argument-hint: [detailed | gaps]
---

# État du projet — pms-midi5

Lis les fichiers ci-dessous et présente un résumé concis.

## Sources (lire dans cet ordre)

1. `CLAUDE.md` — section "État actuel"
2. `docs/memory.md` — header + dernière Phase (si présent)
3. `docs/audit_history.md` — dernier audit (grade + findings) (si présent)
4. `docs/improvements.md` — top 3 gaps CRITICAL/HIGH (si présent)
5. `docs/feature_plan.md` — feature en cours (si présent)
6. `git log --oneline -10` — derniers commits

## Format de sortie

```
═══════════════════════════════════════
  PMS MIDI 5 — STATUS BRIEF
═══════════════════════════════════════

📍 Phase courante : Itération [N] — [Titre]
📊 Statut          : [PASS / EN COURS / SETUP / BLOCKED]
🏆 Dernier audit   : Grade [A/B/C] ([X] findings, [Y] faux positifs éliminés)
                     — ou "Aucun audit encore"

🔥 Firebase        : hava-kitchen (prod) / emulator (dev)
📝 Schémas Zod     : [N] collections typées
🐛 Bugs connus     : [0 ou liste]

📋 Gaps critiques :
  1. [Gap 1] — priorité [CRITICAL/HIGH]
  2. [Gap 2]
  3. [Gap 3]

🔜 Prochaine étape :
  → [Ce qui est prévu ensuite]

📅 Dernières itérations :
  It.[N]   : [one-liner]
  It.[N-1] : [one-liner]
  It.[N-2] : [one-liner]
═══════════════════════════════════════
```

Si `$ARGUMENTS` contient "detailed" :

- Ajouter le résumé complet du dernier audit
- Lister TOUS les gaps
- Inclure les décisions architecturales récentes
- Lister les collections Firestore + leurs rules

Si `$ARGUMENTS` contient "gaps" :

- Focus uniquement sur les gaps avec contexte détaillé
- Pour chaque gap : description, impact, itération estimée

## Si le projet n'a pas encore d'historique

Si `docs/memory.md` et `docs/audit_history.md` n'existent pas :

- Afficher "Itération 0 — setup initial"
- Lister ce qui est en place (Firebase config, rules, schémas Zod, garde-fous)
- Proposer "Lance `/feature` pour démarrer la première vraie feature."
