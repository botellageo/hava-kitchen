import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { etiquetteSchema, type Etiquette } from '@/lib/schemas';

export type EtiquetteDoc = Etiquette & { id: string };

interface CreateEtiquetteInput {
  produit: string;
  prodDate: string;
  dlc: string;
  lot?: string;
  qte: number;
  createdBy: string;
}

interface UseEtiquettesResult {
  etiquettes: EtiquetteDoc[];
  loading: boolean;
  error: Error | null;
  createEtiquette: (input: CreateEtiquetteInput) => Promise<string>;
}

/**
 * Hook live sur les étiquettes récentes (100 dernières par createdAt desc).
 * Donnée HACCP immutable côté rules.
 */
export function useEtiquettes(restaurantId: string | null): UseEtiquettesResult {
  const [etiquettes, setEtiquettes] = useState<EtiquetteDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setEtiquettes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'restaurants', restaurantId, 'etiquettes'),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EtiquetteDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, etiquetteSchema);
          if (parsed) list.push(parsed);
        }
        setEtiquettes(list);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsub;
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [restaurantId]);

  const createEtiquette: UseEtiquettesResult['createEtiquette'] = async (input) => {
    if (!restaurantId) throw new Error('Aucun restaurant courant');
    if (!input.produit.trim()) throw new Error('Produit requis');
    if (!input.prodDate) throw new Error('Date de production requise');
    if (!input.dlc) throw new Error('DLC requise');
    if (!Number.isInteger(input.qte) || input.qte < 1) {
      throw new Error('Quantité doit être un entier >= 1');
    }
    if (!input.createdBy) throw new Error('Identité cuisinier requise');

    interface EtiquettePayload {
      [key: string]: unknown;
      produit: string;
      prodDate: string;
      dlc: string;
      qte: number;
      createdAt: ReturnType<typeof serverTimestamp>;
      createdBy: string;
      lot?: string;
    }
    const payload: EtiquettePayload = {
      produit: input.produit.trim(),
      prodDate: input.prodDate,
      dlc: input.dlc,
      qte: input.qte,
      createdAt: serverTimestamp(),
      createdBy: input.createdBy,
    };
    if (input.lot?.trim()) payload.lot = input.lot.trim();

    const ref = await addDoc(collection(db, 'restaurants', restaurantId, 'etiquettes'), payload);
    return ref.id;
  };

  return { etiquettes, loading, error, createEtiquette };
}
