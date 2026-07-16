# Feature Plan — Réception façon maquette (2 colonnes)

> Date: 2026-07-16 | Dev: Geoffrey | Statut: **EN COURS**
> Branche : `claude/reception-maquette`

## Scope

La page Réception cuisine passe de l'écran « 2 temps » (photo d'abord, formulaire ensuite) à la mise en page de la maquette PMS_04 : **2 colonnes** — carte « Photo de l'étiquette fournisseur » à gauche (zone photo + encart vert IA + encart bleu téléphone perso), carte « Informations livraison » à droite, visible en permanence, avec badge « ✨ Pré-rempli par IA » après OCR.

## Challenge (validé par Geoffrey 2026-07-16)

- **Photo obligatoire conservée** (preuve DDPP) : le formulaire est saisissable d'emblée mais « Enregistrer » reste désactivé sans photo, avec message clair. Zéro changement schéma/rules.
- **Fournisseur : texte libre** (comme actuellement, rempli par l'OCR). Pas de select ni de liste gérée.
- Encart bleu « téléphone perso » repris tel quel (statique).
- `ReceptionPage` (258 L, > seuil 200) découpée en 2 composants ; état (photo, OCR, champs) reste dans la page, composants contrôlés par props.

## Step 1 — Refonte 2 colonnes + découpage

**Commit** : `feat(reception): layout 2 colonnes facon maquette + split composants`
**Fichiers** :

- CREATE `src/components/cuisine/ReceptionPhotoCard.tsx` — carte gauche : `ReceptionPhotoUploader` (existant) si pas de photo, sinon aperçu photo + statut OCR (analyse en cours / erreur / ✓ analysée) ; encarts vert « Auto-remplissage par IA » (tokens `bg-brand-softer`) et bleu « 💡 téléphone perso » (tokens `bg-info-soft`)
- CREATE `src/components/cuisine/ReceptionForm.tsx` — carte droite : titre « Informations livraison » + badge « ✨ Pré-rempli par IA » (visible si OCR réussi), champs Produit / Fournisseur / N° lot + Quantité (field-row) / DLC fournisseur / Notes, bouton « 💾 Enregistrer la réception » désactivé si pas de photo ou produit vide, avec mention « Prends d'abord la photo de l'étiquette » sous le bouton quand pas de photo. Composant contrôlé : `values`, `onChange`, `onSubmit`, `submitting`, `hasPhoto`, `ocrDone`
- MODIFY `src/pages/cuisine/ReceptionPage.tsx` — grille `md:grid-cols-2` avec les 2 cartes, état et logique inchangés (upload → runOcr → remplissage champs → createReception), garde photo obligatoire inchangée

**Validation** : `npx tsc -b --noEmit` + `npm test` + vérif visuelle (2 colonnes tablette, empilé mobile) ; comportement identique : OCR remplit les champs, submit crée la réception immutable avec photo.
**Après** : → `/review` → commit → merge main → deploy hosting

## Notes

- Aucun changement Firestore (schéma, rules, hooks, CF) — refonte UI pure
- `ocrReception` (Gemini/Vertex) inchangée
