import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { equipementSchema, type Equipement } from '@/lib/schemas';
import { DEMO_EQUIPEMENTS, validateEquipementInput, type EquipementInput } from '@/lib/equipements';

export type EquipementDoc = Equipement & { id: string };
export type { EquipementInput };

interface UseEquipementsResult {
  equipements: EquipementDoc[];
  loading: boolean;
  error: Error | null;
  addEquipement: (input: EquipementInput) => Promise<string>;
  updateEquipement: (eid: string, input: EquipementInput) => Promise<void>;
  deleteEquipement: (eid: string) => Promise<void>;
  seedDemo: () => Promise<void>;
}

/**
 * Hook live sur la sous-collection equipements du restaurant donné.
 * Si `restaurantId` est null, le hook reste idle.
 *
 * Lecture autorisée pour gérant + cuisinier (claim).
 * Write réservé au gérant (rules Firestore).
 */
export function useEquipements(restaurantId: string | null): UseEquipementsResult {
  const [equipements, setEquipements] = useState<EquipementDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setEquipements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'restaurants', restaurantId, 'equipements'), orderBy('nom'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: EquipementDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, equipementSchema);
          if (parsed) list.push(parsed);
        }
        setEquipements(list);
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

  const requireResto = () => {
    if (!restaurantId) throw new Error('Aucun restaurant courant');
    return restaurantId;
  };

  const addEquipement: UseEquipementsResult['addEquipement'] = async (input) => {
    const rid = requireResto();
    const clean = validateEquipementInput(input);
    const ref = await addDoc(collection(db, 'restaurants', rid, 'equipements'), {
      ...clean,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateEquipement: UseEquipementsResult['updateEquipement'] = async (eid, input) => {
    const rid = requireResto();
    const clean = validateEquipementInput(input);
    await updateDoc(doc(db, 'restaurants', rid, 'equipements', eid), {
      ...clean,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteEquipement: UseEquipementsResult['deleteEquipement'] = async (eid) => {
    const rid = requireResto();
    await deleteDoc(doc(db, 'restaurants', rid, 'equipements', eid));
  };

  const seedDemo: UseEquipementsResult['seedDemo'] = async () => {
    for (const demo of DEMO_EQUIPEMENTS) {
      await addEquipement(demo);
    }
  };

  return {
    equipements,
    loading,
    error,
    addEquipement,
    updateEquipement,
    deleteEquipement,
    seedDemo,
  };
}
