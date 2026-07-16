# Feature Plan — Écran Températures (données fictives pour démos)

> Date: 2026-07-16 | Dev: Geoffrey | Statut: **EN COURS**
> Branche : `claude/temperatures-demo`

## Scope

Nouvelle page `/cuisine/temperatures` reprenant l'écran Températures de la maquette PMS_04, alimentée par des **données fictives hardcodées** (sondes pas encore livrées) : 3 cartes frigo (température, plage cible, dernière lecture), graphique d'évolution SVG avec onglets 24h/7j/30j fonctionnels + stats (min/max/moyenne/dépassements), boutons « Saisie manuelle » et « Exporter PDF » désactivés (à venir). Bandeau discret « Aperçu — données simulées ». Activation de la tuile Températures sur l'accueil cuisine.

## Challenge (validé par Geoffrey 2026-07-16)

- **Données hardcodées** fidèles à la maquette (pas de lecture `equipements`, pas d'écriture Firestore — surtout PAS de fausses données dans une collection HACCP immutable)
- **Mention discrète** « Aperçu — données simulées, sondes en cours d'installation » (transparence prospect)
- **Périmètre complet** : cartes + graphe interactif (3 périodes) + stats + boutons désactivés
- Zéro changement schéma/rules/hooks/CF — quand les sondes arriveront, seul `demoTemperatures.ts` sera remplacé par un vrai hook

## Step 1 — Données démo + composants FrigoCard / TemperatureChart

**Commit** : `feat(temperatures): donnees demo + composants FrigoCard/TemperatureChart`
**Fichiers** :

- CREATE `src/lib/demoTemperatures.ts` — données fictives typées : `DEMO_FRIGOS` (3 équipements : nom, type d'usage, température actuelle, plage cible, « il y a N min », statut ok) + `DEMO_CHART: Record<'24h'|'7j'|'30j', ChartDataset>` (points, labels d'axe, stats min/max/moyenne/dépassements) pour « Frigo positif 1 » — valeurs de la maquette (4,2 / 3,8 / −19,1 °C, courbe 7 j 2,8–5,1 °C moy 4,0, 0 dépassement), variantes plausibles pour 24h/30j
- CREATE `src/components/cuisine/FrigoCard.tsx` — carte : nom + pastille verte, type d'usage, température en gros (`text-4xl`), « Plage cible : a – b °C », « Dernière lecture il y a N min »
- CREATE `src/components/cuisine/TemperatureChart.tsx` — carte graphique : titre « Évolution — Frigo positif 1 », onglets période (state local), SVG responsive (`viewBox 0 0 700 220`, `preserveAspectRatio="none"`) : lignes de grille + labels °C, zone cible teintée, courbe + aire dégradée (tokens brand), labels d'axe X, rangée de stats sous le graphe

**Validation** : `npx tsc -b --noEmit` + lint ; composants < 200 L.
**Après** : → `/review` → commit

## Step 2 — Page + route + tuile accueil cuisine

**Commit** : `feat(temperatures): page /cuisine/temperatures + activation tuile accueil`
**Fichiers** :

- CREATE `src/pages/cuisine/TemperaturesPage.tsx` — même squelette que ReceptionPage (header AppLogo + ← Retour, gardes cuisinier/restaurantLoading/restaurantId) ; bandeau discret `bg-info-soft` « Aperçu — données simulées, sondes en cours d'installation » ; grille 3 FrigoCard ; TemperatureChart ; 2 boutons pleine largeur désactivés « 📝 Saisie manuelle (à venir) » / « 📄 Exporter PDF (à venir) »
- MODIFY `src/App.tsx` — route `/cuisine/temperatures` (ProtectedRoute + RequireRestaurant, comme les autres pages cuisine)
- MODIFY `src/pages/cuisine/CuisineHomePage.tsx` — la tuile Températures devient un `<Link to="/cuisine/temperatures">` actif (« Lecture frigos et congélateurs. » + « Ouvrir → »), style aligné sur les tuiles Réception/Étiquettes

**Validation** : `npm test` + `npm run build` + navigation locale (tuile → page → retour).
**Après** : → `/review` → commit → merge main → deploy hosting

## Notes

- Données 100 % client-side — aucune trace en base, remplaçables par un hook `useRelevesTemperature` quand les sondes seront livrées (it. future)
- Le graphe ne couvre que « Frigo positif 1 » (fidèle maquette)
