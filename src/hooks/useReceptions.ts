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
import { receptionSchema, type Reception } from '@/lib/schemas';

export type ReceptionDoc = Reception & { id: string };

interface CreateReceptionInput {
  produit: string;
  fournisseur?: string;
  lot?: string;
  qte?: string;
  dlc?: string;
  notes?: string;
  photoUrl: string;
  createdBy: string;
}

interface UseReceptionsResult {
  receptions: ReceptionDoc[];
  loading: boolean;
  error: Error | null;
  createReception: (input: CreateReceptionInput) => Promise<string>;
}

/**
 * Hook live sur les réceptions récentes (50 dernières par createdAt desc).
 * Donnée HACCP immutable côté rules.
 */
export function useReceptions(restaurantId: string | null): UseReceptionsResult {
  const [receptions, setReceptions] = useState<ReceptionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setReceptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'restaurants', restaurantId, 'receptions'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ReceptionDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, receptionSchema);
          if (parsed) list.push(parsed);
        }
        setReceptions(list);
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

  const createReception: UseReceptionsResult['createReception'] = async (input) => {
    if (!restaurantId) throw new Error('Aucun restaurant courant');
    if (!input.produit.trim()) throw new Error('Produit requis');
    if (!input.photoUrl) throw new Error('Photo requise (preuve DDPP)');
    if (!input.createdBy) throw new Error('Identité cuisinier requise');

    interface ReceptionPayload {
      [key: string]: unknown;
      produit: string;
      photoUrl: string;
      createdAt: ReturnType<typeof serverTimestamp>;
      createdBy: string;
      fournisseur?: string;
      lot?: string;
      qte?: string;
      dlc?: string;
      notes?: string;
    }
    const payload: ReceptionPayload = {
      produit: input.produit.trim(),
      photoUrl: input.photoUrl,
      createdAt: serverTimestamp(),
      createdBy: input.createdBy,
    };
    if (input.fournisseur?.trim()) payload.fournisseur = input.fournisseur.trim();
    if (input.lot?.trim()) payload.lot = input.lot.trim();
    if (input.qte?.trim()) payload.qte = input.qte.trim();
    if (input.dlc?.trim()) payload.dlc = input.dlc.trim();
    if (input.notes?.trim()) payload.notes = input.notes.trim();

    const ref = await addDoc(collection(db, 'restaurants', restaurantId, 'receptions'), payload);
    return ref.id;
  };

  return { receptions, loading, error, createReception };
}
