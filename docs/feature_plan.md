# Feature Plan — Refonte Espace gestion (dashboard admin façon maquette)

> Date: 2026-07-16 | Dev: Geoffrey | Statut: **EN COURS**
> Branche : `claude/admin-dashboard-maquette`

## Scope

Le dashboard admin (`/admin`) passe de 4 tuiles-liens à une grille de 4 cards riches reprenant la maquette `PMS_04_demo_app.html` : **Équipe** (liste + gestion inline), **Frigos & sondes** (nouvelle collection `equipements`, config seulement, + pré-remplissage démo), **Templates produits** (liste + gestion inline), **Exports DDPP** (vraie feature : registre mensuel PDF + historique). Les pages `/admin/cuisiniers` et `/admin/templates` sont supprimées (tout inline).

## Challenge (validé par Geoffrey 2026-07-16)

- Frigos & sondes → **vraie collection** `equipements` (config nom/type/seuils/sonde, pas de relevés) + bouton de seed démo dans l'état vide
- Exports DDPP → **vraie feature maintenant** : PDF client-side (jsPDF déjà en dep) compilant réceptions + étiquettes du mois, trace d'export en Firestore (create-only)
- Pages dédiées → **supprimées**, gestion 100 % inline sur le dashboard, nav allégée
- Badge équipement : statut statique « OK » tant que le module Températures n'existe pas (pas de sonde branchée)
- Accès Mode cuisine : conservé via bouton dans l'en-tête du dashboard

## Step 1 — Collection equipements (schéma + rules + hook)

**Commit** : `feat(equipements): schema + rules + hook config frigos/sondes`
**Fichiers** :

- CREATE `src/lib/schemas/equipement.ts`
- MODIFY `src/lib/schemas/index.ts` (ajout export)
- MODIFY `firestore.rules` (sub `equipements` : read owner+cuisinier, write owner)
- CREATE `src/hooks/useEquipements.ts`
- CREATE `src/test/rules/equipements.test.ts` (même pattern que `templates.test.ts`, exécution différée JDK 21)

**Code — schéma** :

```ts
// src/lib/schemas/equipement.ts
import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Équipement froid configurable par le gérant (config, PAS un relevé HACCP → mutable).
 * - `type` : pilote l'icône et les seuils par défaut à l'ajout
 * - `seuilMin`/`seuilMax` : bornes d'alerte en °C (futur module Températures)
 * - `sondeId` : identifiant sonde physique (optionnel tant que non livrées)
 *
 * Path Firestore : restaurants/{rid}/equipements/{eid}
 */
export const equipementSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(['frigo', 'congelateur', 'autre']),
  seuilMin: z.number(),
  seuilMax: z.number(),
  sondeId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Equipement = z.infer<typeof equipementSchema>;
```

**Code — rule** (dans le bloc `match /restaurants/{rid}`) :

```js
// sub: equipements/{eid} — config frigos/sondes (mutable, write gérant only)
match /equipements/{eid} {
  allow read: if isRestoOwner(rid) || isCuisinierOfResto(rid);
  allow create, update, delete: if isRestoOwner(rid);
}
```

**Code — hook** : `useEquipements(restaurantId)` sur le modèle exact de `useProductTemplates` (onSnapshot + `tryParseDoc` + orderBy('nom')), mutations `addEquipement` / `updateEquipement` / `deleteEquipement` avec validation du payload avant écriture, + `seedDemo()` qui crée les 3 équipements de la maquette (Frigo positif 1 & 2 seuils 0/+6, Congélateur seuils −22/−18, sondes 0xA1B2/B3/B4).

**Validation** : `npm test` + `npm run build` passent.
**Après** : → `/review` → commit

## Step 2 — Trace exports DDPP (schéma + rules + hook)

**Commit** : `feat(exports): schema + rules + hook historique exports DDPP`
**Fichiers** :

- CREATE `src/lib/schemas/exportDdpp.ts`
- MODIFY `src/lib/schemas/index.ts`
- MODIFY `firestore.rules` (sub `exportsDdpp` : owner read+create, `allow update, delete: if false`)
- CREATE `src/hooks/useExportsDdpp.ts`

**Code — schéma** :

```ts
// src/lib/schemas/exportDdpp.ts
import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Trace d'un export registre DDPP (create-only : preuve qu'un export a été produit).
 * Le PDF n'est pas stocké — il est regénéré à la demande depuis les données
 * immutables (receptions + etiquettes), ce qui garantit sa fidélité.
 *
 * - `mois` : période couverte au format YYYY-MM
 *
 * Path Firestore : restaurants/{rid}/exportsDdpp/{xid}
 * Immutable : allow update, delete: if false.
 */
export const exportDdppSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}$/),
  nbReceptions: z.number().int().min(0),
  nbEtiquettes: z.number().int().min(0),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
});

export type ExportDdpp = z.infer<typeof exportDdppSchema>;
```

**Code — rule** :

```js
// sub: exportsDdpp/{xid} — trace des registres générés (gérant only, create-only)
match /exportsDdpp/{xid} {
  allow read: if isRestoOwner(rid);
  allow create: if isRestoOwner(rid)
    && request.resource.data.keys().hasAll(['mois', 'nbReceptions', 'nbEtiquettes', 'createdAt', 'createdBy']);
  allow update, delete: if false;
}
```

**Code — hook** : `useExportsDdpp(restaurantId)` : onSnapshot orderBy('createdAt', 'desc') + `addExport({ mois, nbReceptions, nbEtiquettes, createdBy })`.

**Validation** : `npm test` + `npm run build` passent.
**Après** : → `/review` → commit

## Step 3 — Génération PDF registre mensuel

**Commit** : `feat(exports): generation PDF registre mensuel DDPP`
**Fichiers** :

- CREATE `src/lib/registreData.ts` — `getRegistreData(restaurantId, mois)` : deux `getDocs` ponctuels (receptions + etiquettes du mois, `where('createdAt', '>=', start)` / `< end`, index mono-champ automatique), parse via `tryParseDoc`, retourne `{ receptions, etiquettes }`
- CREATE `src/lib/generateRegistrePdf.ts` — `generateRegistrePdf({ restaurantNom, mois, receptions, etiquettes })` : jsPDF A4 portrait, en-tête (resto, période, date de génération), section **Réceptions** (tableau date / produit / fournisseur / lot / qté / DLC), section **Étiquettes DLC** (tableau date / produit / prod. le / DLC / qté / par), pagination manuelle (helper ligne par ligne comme `generateEtiquettePdf.ts`, pas de dépendance jspdf-autotable), pied « Document généré par PMS Midi 5 — données immutables » ; `.save('registre-ddpp-YYYY-MM.pdf')`

**Validation** : test unitaire Vitest sur le découpage de mois (bornes start/end) + génération manuelle d'un PDF en local.
**Après** : → `/review` → commit

## Step 4 — Cards Équipe + Templates produits (+ AdminCard générique)

**Commit** : `feat(admin): cards Equipe + Templates produits inline`
**Fichiers** :

- CREATE `src/components/admin/AdminCard.tsx` — wrapper card : `{ icon, title, children, footer }`, style maquette (`bg-surface rounded-card border`)
- CREATE `src/components/admin/EquipeCard.tsx` — reprend la logique de `CuisiniersPage` (rows avatar + prénom + statut PIN, boutons Modifier / Désactiver / Supprimer compacts, `CuisinierFormModal` existant, bouton « + Ajouter un membre » pleine largeur en footer, états loading/vide)
- CREATE `src/components/admin/TemplatesCard.tsx` — reprend la logique de `TemplatesPage` (rows nom + « DLC + N j », Modifier / Supprimer, `ProductTemplateFormModal` existant, « + Ajouter un produit » en footer)

**Contrainte** : chaque composant < 200 lignes (la logique CRUD vit déjà dans les hooks).
**Validation** : vérif visuelle en dev local sur `/admin`.
**Après** : → `/review` → commit

## Step 5 — Cards Frigos & sondes + Exports DDPP

**Commit** : `feat(admin): cards Equipements + Exports DDPP`
**Fichiers** :

- CREATE `src/components/admin/EquipementFormModal.tsx` — form nom / type (select) / seuils min-max / sondeId optionnel, sur le modèle de `ProductTemplateFormModal`
- CREATE `src/components/admin/EquipementsCard.tsx` — rows nom + « Sonde : X — Seuils a/b °C » + badge statique « OK », Modifier / Supprimer, footer « + Ajouter un équipement » ; état vide avec DEUX boutons : « + Ajouter » et « Pré-remplir (démo) » → `seedDemo()`
- CREATE `src/components/admin/ExportsDdppCard.tsx` — historique (mois + « Généré le … par … » + bouton Télécharger qui regénère le PDF à la volée via `getRegistreData` + `generateRegistrePdf`), bouton primaire « Générer le registre du mois en cours » (génère + télécharge + `addExport`), loading state pendant génération

**Validation** : génération réelle d'un registre sur le compte démo (données réelles du resto de test).
**Après** : → `/review` → commit

## Step 6 — Refonte DashboardPage + suppression pages + nav

**Commit** : `refactor(admin): dashboard facon maquette, suppression pages Cuisiniers/Produits`
**Fichiers** :

- MODIFY `src/pages/admin/DashboardPage.tsx` — greeting + titre « Gestion » + bouton « Mode cuisine → » dans l'en-tête, grille `md:grid-cols-2` avec les 4 cards
- MODIFY `src/App.tsx` — suppression routes `/admin/cuisiniers` et `/admin/templates`
- MODIFY `src/pages/admin/AdminLayout.tsx` — nav réduite à Accueil + Paramètres (desktop + mobile)
- DELETE `src/pages/admin/CuisiniersPage.tsx`
- DELETE `src/pages/admin/TemplatesPage.tsx`

**Validation** : navigation complète en dev local (aucun lien mort), `npm test`, `npm run build`.
**Après** : → `/review` → `/audit` → `/update-docs` → push → merge main

## Notes

- jsPDF déjà présent (étiquettes) — **aucune nouvelle dépendance**
- Les tests rules (`equipements.test.ts`) restent différés tant que JDK 17 (blocker connu)
- Le badge « OK » des équipements deviendra dynamique avec le module Températures (it. future)
- `CuisinierFormModal` et `ProductTemplateFormModal` réutilisés tels quels — zéro duplication
