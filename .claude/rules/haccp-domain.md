---
paths: []
---

# Domaine HACCP — pms-midi5

> Vocabulaire et règles métier essentiels pour développer un PMS HACCP pour restaurant.

## Pourquoi ce projet existe

- **JB** (Jean-Bertrand Mouls) est gérant du restaurant Midi 5 et ami de Geoffrey
- Le PMS HACCP est une **obligation légale** pour tout établissement de restauration (art. R231-19 CRPM, règlement CE 852/2004)
- Geoffrey développe ce PMS **custom** offert à JB — alternative à **ePackPro** (ex-e-pack HYGIENE, CHR Numérique, CA 30M€ 2024), l'incumbent du marché
- L'angle compétitif : **simplicité d'usage en cuisine** (tablette, gestes rapides) vs usine à gaz complexe

## Vocabulaire essentiel

| Terme              | Définition                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PMS**            | Plan de Maîtrise Sanitaire. Document obligatoire qui décrit les mesures pour assurer la sécurité sanitaire des aliments.                             |
| **HACCP**          | Hazard Analysis Critical Control Points. Méthode d'analyse et de maîtrise des dangers (microbiologiques, chimiques, physiques).                      |
| **CCP**            | Critical Control Point. Étape où un contrôle est essentiel pour prévenir/éliminer un danger (ex: cuisson, refroidissement, température de stockage). |
| **PrPO**           | Programme prérequis opérationnel. Mesures de maîtrise non-critiques mais importantes (nettoyage, hygiène personnel).                                 |
| **DLC**            | Date Limite de Consommation. "À consommer jusqu'au..." — au-delà, danger sanitaire.                                                                  |
| **DDM**            | Date de Durabilité Minimale. "À consommer de préférence avant..." — qualité, pas danger.                                                             |
| **Traçabilité**    | Capacité à retracer le parcours d'un produit (origine, lot, date réception, transformation, vente).                                                  |
| **Non-conformité** | Écart constaté (ex: température hors seuil). Doit déclencher une action corrective tracée.                                                           |
| **DDPP**           | Direction Départementale de la Protection des Populations. Autorité de contrôle qui vérifie le PMS lors d'inspections.                               |

## Seuils de température (référentiel courant)

| Équipement / Étape     | Seuil                  |
| ---------------------- | ---------------------- |
| Frigo positif          | 0 à 4°C                |
| Congélateur            | ≤ -18°C                |
| Cuisson volaille       | ≥ 74°C à cœur          |
| Cuisson viande         | ≥ 63°C à cœur          |
| Maintien chaud         | ≥ 63°C                 |
| Refroidissement rapide | de 63°C à 10°C en < 2h |
| Décongélation          | en frigo, < 4°C        |

> Ces seuils peuvent varier selon le type de produit et la réglementation locale. **Ne JAMAIS hardcoder un seuil sans confirmation Geoffrey/JB.**

## Modules typiques d'un PMS

1. **Relevés de température** — frigos, congélos, cuissons, refroidissements
2. **Plan de nettoyage** — zones, fréquences, produits, opérateurs, validation
3. **Traçabilité produits** — réception (DLC, lot, fournisseur, T°), transformation, vente
4. **Non-conformités** — écarts constatés + actions correctives
5. **Formation personnel** — hygiène, gestes, certifications
6. **Maîtrise des fournisseurs** — agréments, audits, fiches techniques
7. **Plan de lutte contre les nuisibles** — passages, constats, traitements

## Règles critiques de développement

### 1. Immutabilité des relevés (LÉGAL)

Tout relevé HACCP a **valeur de preuve sanitaire** lors d'un contrôle DDPP. Modification = fraude potentielle.

```js
// Firestore Rules — OBLIGATOIRE sur toute collection HACCP
allow update, delete: if false;
```

Si correction nécessaire → **créer un nouveau relevé** marqué "correction" avec ref au précédent (`correctsId`). Le précédent reste intact.

### 2. Horodatage serveur (PAS client)

Les relevés doivent utiliser le timestamp **serveur Firestore** (`serverTimestamp()`), pas l'heure du client (manipulable).

### 3. Identité opérateur

Chaque relevé doit tracer **qui** a fait la mesure (`createdBy` = `request.auth.uid`). Pas d'écriture anonyme.

### 4. Alertes sur seuil

Si un relevé est hors seuil → alerte visible immédiatement (toast/badge), idéalement notification push à JB. Cloud Function `onDocumentCreated` peut envoyer un email/SMS.

### 5. Export PMS

Le restaurateur doit pouvoir **exporter ses relevés** (PDF ou Excel) pour les présenter à un contrôle. Export = read-only, ne modifie rien.

## Anti-recommandations

- **Ne JAMAIS** proposer de "fonctionnalité d'édition rétroactive" — c'est illégal
- **Ne JAMAIS** suggérer de "rappeler le relevé d'hier si oublié" sans timestamp serveur clair (sinon = falsification)
- **Ne JAMAIS** stocker un seuil HACCP en dur dans le code → toujours configurable par établissement
- Pas de recommandation médicale, sanitaire ou réglementaire de la part de Claude — Geoffrey/JB décident en fonction de leurs obligations locales

## Cible utilisateur

- **JB** : gérant, valide les configs (équipements, seuils, fréquences)
- **Staff cuisine** : fait les relevés, doit pouvoir saisir **en < 10 secondes** sur tablette avec mains potentiellement humides/sales
- **Auditeur DDPP** : consulte/exporte les relevés (lecture seule) en cas d'inspection

## Concurrent : ePackPro

- Solution incumbent du marché (CA 30M€ 2024, SIREN CHR Numérique 789845120)
- Reproche courant : complexité, lenteur, formulaires longs
- Notre angle : **UI épurée**, gestes rapides, mobile-first cuisine
