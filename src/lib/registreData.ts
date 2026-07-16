import { collection, getDocs, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { etiquetteSchema, receptionSchema, type Etiquette, type Reception } from '@/lib/schemas';

export type ReceptionRegistre = Reception & { id: string };
export type EtiquetteRegistre = Etiquette & { id: string };

export interface RegistreData {
  receptions: ReceptionRegistre[];
  etiquettes: EtiquetteRegistre[];
}

/**
 * Bornes d'un mois calendaire local pour une clé YYYY-MM.
 * `start` inclus, `end` exclu (1er jour du mois suivant à 00:00).
 */
export function monthBounds(mois: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})$/.exec(mois);
  if (!match) throw new Error('Mois invalide (format YYYY-MM attendu)');
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error('Mois invalide (01 à 12)');
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

/**
 * Lecture ponctuelle (getDocs) des réceptions et étiquettes d'un mois donné,
 * pour la génération du registre DDPP. Données immutables → le registre
 * regénéré est toujours fidèle à ce qui a été tracé.
 */
export async function getRegistreData(restaurantId: string, mois: string): Promise<RegistreData> {
  const { start, end } = monthBounds(mois);
  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);

  const receptionsQuery = query(
    collection(db, 'restaurants', restaurantId, 'receptions'),
    where('createdAt', '>=', startTs),
    where('createdAt', '<', endTs),
    orderBy('createdAt'),
  );
  const etiquettesQuery = query(
    collection(db, 'restaurants', restaurantId, 'etiquettes'),
    where('createdAt', '>=', startTs),
    where('createdAt', '<', endTs),
    orderBy('createdAt'),
  );

  const [receptionsSnap, etiquettesSnap] = await Promise.all([
    getDocs(receptionsQuery),
    getDocs(etiquettesQuery),
  ]);

  const receptions: ReceptionRegistre[] = [];
  for (const d of receptionsSnap.docs) {
    const parsed = tryParseDoc(d, receptionSchema);
    if (parsed) receptions.push(parsed);
  }
  const etiquettes: EtiquetteRegistre[] = [];
  for (const d of etiquettesSnap.docs) {
    const parsed = tryParseDoc(d, etiquetteSchema);
    if (parsed) etiquettes.push(parsed);
  }

  return { receptions, etiquettes };
}
