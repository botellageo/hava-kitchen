/**
 * Données FICTIVES de l'écran Températures — pour les démos restaurateurs
 * tant que les sondes ne sont pas livrées.
 *
 * IMPORTANT : 100 % client-side, rien n'est écrit en base (surtout pas dans
 * une collection HACCP immutable). Quand les sondes arriveront, ce fichier
 * sera remplacé par un vrai hook `useRelevesTemperature` — les composants
 * FrigoCard / TemperatureChart restent.
 */

export interface DemoFrigo {
  nom: string;
  usage: string;
  /** Température actuelle simulée (°C) */
  temp: number;
  /** Plage cible [min, max] en °C */
  plage: [number, number];
  /** « Dernière lecture il y a N min » */
  minutesAgo: number;
}

export const DEMO_FRIGOS: DemoFrigo[] = [
  {
    nom: 'Frigo positif 1',
    usage: 'Viandes & charcuterie',
    temp: 4.2,
    plage: [0, 6],
    minutesAgo: 3,
  },
  {
    nom: 'Frigo positif 2',
    usage: 'Légumes & produits laitiers',
    temp: 3.8,
    plage: [0, 6],
    minutesAgo: 2,
  },
  {
    nom: 'Congélateur',
    usage: 'Surgelés',
    temp: -19.1,
    plage: [-22, -18],
    minutesAgo: 4,
  },
];

export type ChartPeriod = '24h' | '7j' | '30j';

export interface ChartDataset {
  /** Températures simulées (°C), tracées de gauche à droite */
  points: number[];
  /** Labels de l'axe X (même longueur que points) */
  labels: string[];
  /** Suffixe des stats (« Min 7 j », « Min 24 h »…) */
  statsLabel: string;
}

/**
 * Historique simulé du « Frigo positif 1 » (plage cible 0–6 °C) par période.
 * Les stats (min/max/moyenne/dépassements) sont CALCULÉES depuis les points
 * par le composant graphique — cohérence garantie.
 */
export const DEMO_CHART: Record<ChartPeriod, ChartDataset> = {
  '24h': {
    points: [3.9, 4.1, 4.4, 4.7, 4.2, 3.8, 3.5, 3.9, 4.2],
    labels: ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h'],
    statsLabel: '24 h',
  },
  '7j': {
    points: [4.0, 3.2, 4.6, 2.8, 3.7, 5.1, 4.2],
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    statsLabel: '7 j',
  },
  '30j': {
    points: [3.8, 4.2, 4.6, 3.5, 2.9, 4.1, 4.9, 4.3, 3.7, 4.0],
    labels: ['J1', 'J4', 'J7', 'J10', 'J13', 'J16', 'J19', 'J22', 'J25', 'J28'],
    statsLabel: '30 j',
  },
};

/** Format français : 4.2 → « 4,2 » */
export function formatTemp(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
