---
name: update-docs
description: Updates project documentation after an audit or iteration. Synchronizes memory.md, CLAUDE.md, improvements.md. USE WHEN user says "update docs", "update-docs", "mets à jour les docs", "synchronise la doc", "finalise la doc", or after completing an /audit to finalize documentation.
disable-model-invocation: false
allowed-tools: Read, Write, Edit, Grep, Glob
argument-hint: [all | memory | claude | improvements]
---

# Mise à jour documentation — pms-midi5

Tu mets à jour la documentation après un audit terminé.

## Fichiers à synchroniser

### 1. `docs/memory.md` (créer si absent)

Structure attendue :

```
# pms-midi5 — Memory

> Phase courante : Itération [N] — [Titre court]

## Phases

- ✅ Phase [N] — Itération [N] : [Titre] ([X] créé + [Y] modifiés, audit [GRADE], [Z] bug)
  - [résumé bullet 1]
  - [résumé bullet 2]
```

Actions :

- Mettre à jour le header (ligne 2-3 : "Phase courante" et "Itération")
- Ajouter l'entrée Phase [N] dans la liste (append-only)
- Format : `- ✅ Phase [N] — Itération [N] : [Titre] ([X] créé + [Y] modifiés, audit [GRADE], [Z] bug)`
- Sous-items : résumé des changements clés (2-4 lignes)

### 2. `CLAUDE.md` (racine projet)

- Mettre à jour `Itération [N]` dans la section **État actuel**
- Ajouter `✅ It.[N] : [Titre court]` dans la liste des itérations (créer la liste si elle n'existe pas)
- Si nouveaux fichiers > 300 lignes : ajouter dans les exceptions de taille
- Si nouveau finding à surveiller : ajouter un ⚠️

### 3. `docs/improvements.md` (si applicable)

- Supprimer les items qui viennent d'être implémentés
- Ajouter les nouveaux findings LOW de l'audit comme items backlog
- Garder par sévérité : CRITICAL / HIGH / MEDIUM / LOW

### 4. `README.md` (optionnel)

Si une nouvelle commande/script/structure majeure a été ajoutée → mettre à jour la section concernée.

## Règles

- Ne JAMAIS supprimer de l'historique existant (append-only sur memory.md)
- Garder la cohérence des dates et numéros d'itération
- Si un fichier dépasse 300 lignes pour la première fois, le noter dans CLAUDE.md
- Vérifier que les cross-references entre fichiers sont cohérentes
- Date au format ISO `YYYY-MM-DD`
- Toujours mentionner si une nouvelle collection Firestore + schéma Zod + rule a été ajoutée
