import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { exportDdppSchema, type ExportDdpp } from '@/lib/schemas';

export type ExportDdppDoc = ExportDdpp & { id: string };

export interface ExportDdppInput {
  mois: string;
  nbReceptions: number;
  nbEtiquettes: number;
  createdBy: string;
}

interface UseExportsDdppResult {
  exports: ExportDdppDoc[];
  loading: boolean;
  error: Error | null;
  addExport: (input: ExportDdppInput) => Promise<string>;
}

/**
 * Hook live sur la sous-collection exportsDdpp du restaurant donné
 * (historique des registres DDPP générés, plus récent en premier).
 * Si `restaurantId` est null, le hook reste idle.
 *
 * Gérant uniquement (rules Firestore). Create-only : la trace d'un export
 * ne se modifie ni ne se supprime.
 */
export function useExportsDdpp(restaurantId: string | null): UseExportsDdppResult {
  const [exports_, setExports] = useState<ExportDdppDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setExports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'restaurants', restaurantId, 'exportsDdpp'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ExportDdppDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, exportDdppSchema);
          if (parsed) list.push(parsed);
        }
        setExports(list);
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

  const addExport: UseExportsDdppResult['addExport'] = async (input) => {
    if (!restaurantId) throw new Error('Aucun restaurant courant');
    if (!/^\d{4}-\d{2}$/.test(input.mois)) throw new Error('Mois invalide (format YYYY-MM)');
    const createdBy = input.createdBy.trim();
    if (!createdBy) throw new Error('createdBy requis');
    if (
      !Number.isInteger(input.nbReceptions) ||
      !Number.isInteger(input.nbEtiquettes) ||
      input.nbReceptions < 0 ||
      input.nbEtiquettes < 0
    ) {
      throw new Error('Compteurs invalides');
    }
    const ref = await addDoc(collection(db, 'restaurants', restaurantId, 'exportsDdpp'), {
      mois: input.mois,
      nbReceptions: input.nbReceptions,
      nbEtiquettes: input.nbEtiquettes,
      createdBy,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  return { exports: exports_, loading, error, addExport };
}
