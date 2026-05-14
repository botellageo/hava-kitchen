# Feature Plan — It.4 Réception OCR + Étiquettes DLC

> Date : 2026-05-14 | Dev : Geoffrey | Statut : **EN COURS**
> Branche : `claude/interesting-taussig-f9ec09`

## Scope

Deux modules HACCP cuisine groupés en une itération (partage les Templates produits) :

1. **Réception** : photo de l'étiquette fournisseur → OCR Claude Vision IA → formulaire pré-rempli → validation → Firestore immutable + photo Storage 3 ans (preuve DDPP).
2. **Étiquettes DLC** : sélection produit (Templates) + date production + lot + quantité → aperçu visuel 62×29mm → génération PDF (impression Brother QL-820NWB simulée, intégration réelle en it.5+).

## Hors scope it.4

- Impression réelle Brother QL-820NWB (it.5+ matériel)
- Module Températures (it.6+ sondes)
- Module Plan de nettoyage, Non-conformités, Exports DDPP (it.7+)
- Save-as-draft pour réception (simple submit final)

## Challenge (validé)

| Axe                      | Décision                                                                 |
| ------------------------ | ------------------------------------------------------------------------ |
| **Modèle OCR**           | `claude-haiku-4-5` (rapide, ~0.001€/photo, suffisant)                    |
| **Templates produits**   | Vides au démarrage, JB crée depuis `/admin/templates`                    |
| **Compression photo**    | `browser-image-compression` max 1920px + JPEG 0.8 (~300-500kb)           |
| **Validation réception** | Submit final, pas de drafts                                              |
| **Stockage photo**       | Firebase Storage permanent (3 ans, preuve DDPP)                          |
| **CF auth**              | owner OR cuisinier authentifié (claim restaurantId)                      |
| **Secret Anthropic**     | `ANTHROPIC_API_KEY` via `firebase functions:secrets:set` (jamais bundlé) |
| **Immutabilité**         | `receptions` + `etiquettes` = `allow update, delete: if false;` (HACCP)  |
| **PDF**                  | `jspdf` client (~50kb), pas de CF                                        |

## Nouvelles collections

| Path                                       | Schéma                                                                               | Rules                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `restaurants/{rid}/productTemplates/{pid}` | `{ nom, dlcDays, createdAt, updatedAt }`                                             | Read owner+cuisinier ; Write owner only                       |
| `restaurants/{rid}/receptions/{rid_id}`    | `{ produit, fournisseur, lot?, qte?, dlc?, photoUrl, notes?, createdAt, createdBy }` | Read owner+cuisinier ; Create owner+cuisinier ; **immutable** |
| `restaurants/{rid}/etiquettes/{eid}`       | `{ produit, prodDate, dlc, lot?, qte, createdAt, createdBy }`                        | Idem (immutable)                                              |

## Dépendances à installer

```bash
# Client
npm i browser-image-compression jspdf

# Functions
cd functions && npm i @anthropic-ai/sdk
```

## Pré-requis manuel Geoffrey

```bash
# Secret Anthropic (1× au début)
firebase functions:secrets:set ANTHROPIC_API_KEY
# Coller la clé Anthropic
```

---

## Step 4.1 — Schémas Zod + utilitaires

**Commit** : `feat(schemas): productTemplate + reception + etiquette + tests`

**Fichiers** :

- CREATE `src/lib/schemas/productTemplate.ts`
- CREATE `src/lib/schemas/reception.ts`
- CREATE `src/lib/schemas/etiquette.ts`
- MODIFY `src/lib/schemas/index.ts` (exports)

**Validation** : `npm test` passe. Schemas parsent les payloads attendus.

---

## Step 4.2 — Firestore rules + Storage rules

**Commit** : `feat(rules): 3 sous-collections (templates + receptions + etiquettes) + storage path-based`

**Fichiers** :

- MODIFY `firestore.rules` — ajout 3 sous-collections avec immutabilité HACCP
- MODIFY `storage.rules` — path-based access pour `restaurants/{rid}/receptions/{rid_id}/photo.jpg`
- CREATE `src/test/rules/templates.test.ts` (gestion CRUD owner)
- CREATE `src/test/rules/haccp_immutable.test.ts` (immutable receptions + etiquettes)

**Validation** : `npm run test:rules` (différé JDK 21) ; rules compilent sans erreur via `firebase deploy --only firestore:rules --dry-run`.

---

## Step 4.3 — Hooks Firestore

**Commit** : `feat(hooks): useProductTemplates + useReceptions + useEtiquettes`

**Fichiers** :

- CREATE `src/hooks/useProductTemplates.ts` (CRUD live)
- CREATE `src/hooks/useReceptions.ts` (live + createReception)
- CREATE `src/hooks/useEtiquettes.ts` (live + createEtiquette)

**Validation** : TS strict + lint OK. Tests unit déférés (priorité audit).

---

## Step 4.4 — Page Admin /admin/templates + nav

**Commit** : `feat(admin): page Templates produits CRUD`

**Fichiers** :

- CREATE `src/pages/admin/TemplatesPage.tsx` (liste + Modal ajout/édition)
- CREATE `src/components/admin/ProductTemplateFormModal.tsx` (form nom + dlcDays)
- MODIFY `src/App.tsx` (route `/admin/templates`)
- MODIFY `src/pages/admin/AdminLayout.tsx` (item nav "Produits")
- MODIFY `src/pages/admin/DashboardPage.tsx` (4e tuile vers /admin/templates)

**Validation** : Ajout template "Tartare de saumon DLC + 3 j", apparait dans la liste live, modif/suppr fonctionnent.

---

## Step 4.5 — Functions deps + helper Anthropic

**Commit** : `chore(functions): install @anthropic-ai/sdk + helper Claude Vision`

**Fichiers** :

- MODIFY `functions/package.json` (add `@anthropic-ai/sdk`)
- CREATE `functions/src/anthropic.ts` (client wrapper avec gestion secret + retry)

**Validation** : `cd functions && npm run build` OK.

---

## Step 4.6 — CF ocrReception (callable + Claude Vision)

**Commit** : `feat(functions): CF ocrReception (Claude Vision -> JSON structure)`

**Fichiers** :

- CREATE `functions/src/ocr.ts` (callable, auth owner|cuisinier, télécharge image, appel Claude haiku-4-5 avec prompt structuré, parse JSON, retourne fields)
- MODIFY `functions/src/auth.ts` (helper `assertOwnerOrCuisinier(uid, rid)` réutilisé)
- MODIFY `functions/src/index.ts` (export ocrReception)

**Validation** : Build CF OK. Test manuel après deploy (cf step 4.9).

---

## Step 4.7 — Page /cuisine/reception + Photo + OCR flow

**Commit** : `feat(cuisine): page reception photo + OCR auto-remplissage`

**Fichiers** :

- CREATE `src/lib/imageCompress.ts` (wrap `browser-image-compression`)
- CREATE `src/components/cuisine/ReceptionPhotoUploader.tsx` (input file capture + compress + Storage upload + progress)
- CREATE `src/pages/cuisine/ReceptionPage.tsx` (orchestre photo → OCR → form → submit)
- MODIFY `src/App.tsx` (route `/cuisine/reception`)
- MODIFY `src/pages/cuisine/CuisineHomePage.tsx` (tile Réception cliquable + lien)

**Validation** : Sur prod, photo prise → upload Storage → OCR retourne fields → form pré-rempli → submit → doc receptions créé. Photo visible dans Storage console.

---

## Step 4.8 — Page /cuisine/etiquettes (form + aperçu + PDF)

**Commit** : `feat(cuisine): page etiquettes DLC + apercu + PDF download`

**Fichiers** :

- CREATE `src/lib/generateEtiquettePdf.ts` (wrap `jspdf` + format 62×29mm)
- CREATE `src/components/cuisine/EtiquettePreview.tsx` (rendu visuel HTML)
- CREATE `src/pages/cuisine/EtiquettesPage.tsx` (form + aperçu live + PDF)
- MODIFY `src/App.tsx` (route `/cuisine/etiquettes`)
- MODIFY `src/pages/cuisine/CuisineHomePage.tsx` (tile Étiquettes DLC cliquable + lien)

**Validation** : Sélection template "Tartare DLC + 3 j" + date prod aujourd'hui → DLC calculée → PDF téléchargé avec bons contenus → doc etiquettes créé.

---

## Step 4.9 — Tests + /audit + deploy + smoke test

**Commit** : `test: tests unit critiques + audit + deploy`

**Fichiers** :

- CREATE `src/hooks/useReceptions.test.ts` (mock Firestore, vérifier createReception passe par parseDoc et n'envoie pas de PII non validée)
- (Eventuels fixes audit)

**Après** :

- `firebase deploy --only firestore:rules,storage,functions,hosting`
- Smoke test prod : ajouter template, faire une réception fictive avec photo, générer étiquette
- `/update-docs` (memory.md, CLAUDE.md, improvements.md)
- Push branche

---

## Notes & risques

- **OCR Claude** : si l'API échoue (timeout, mauvaise réponse JSON), fallback "Remplis manuellement" — le form reste utilisable sans OCR. Le bouton "Réessayer OCR" peut relancer.
- **Format prompt** : prompt structuré JSON strict pour minimiser parsing errors. Exemple : `Return ONLY a JSON object with these exact keys: produit (string), fournisseur (string|null), lot (string|null), qte (string|null), dlc (string ISO date|null). No prose, no markdown.`
- **Coût Storage 3 ans** : ~500kb × N réceptions/jour × 365 × 3 = à monitorer. Lifecycle policy GCS à ajouter en it.5+ si volume problématique.
- **PDF taille** : étiquette = 1 page mini. Pas de souci performance.
- **Aperçu étiquette** : utilise la même police et layout que la maquette HTML (cf. PMS_04_demo_app.html `label-render` class).
