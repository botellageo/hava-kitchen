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
import { cuisinierSchema, type Cuisinier } from '@/lib/schemas';
import { hashPin, verifyPin } from '@/lib/pin';

export type CuisinierDoc = Cuisinier & { id: string };

interface UseCuisiniersResult {
  cuisiniers: CuisinierDoc[];
  loading: boolean;
  error: Error | null;
  addCuisinier: (input: { prenom: string; nom: string; pin: string }) => Promise<string>;
  updateCuisinier: (
    cid: string,
    input: { prenom?: string; nom?: string; pin?: string },
  ) => Promise<void>;
  toggleActif: (cid: string, actif: boolean) => Promise<void>;
  deleteCuisinier: (cid: string) => Promise<void>;
  verifyCuisinierPin: (cid: string, pin: string) => Promise<boolean>;
}

/**
 * Hook live (onSnapshot) sur la sous-collection cuisiniers du restaurant donné.
 * Si `restaurantId` est null, le hook reste en idle (cuisiniers vide, loading false).
 */
export function useCuisiniers(restaurantId: string | null): UseCuisiniersResult {
  const [cuisiniers, setCuisiniers] = useState<CuisinierDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Sync du state avec la sous-collection cuisiniers du resto sélectionné :
    // (re)setup du listener à chaque changement de restaurantId.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setCuisiniers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(collection(db, 'restaurants', restaurantId, 'cuisiniers'), orderBy('prenom'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: CuisinierDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, cuisinierSchema);
          if (parsed) list.push(parsed);
        }
        setCuisiniers(list);
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

  const addCuisinier: UseCuisiniersResult['addCuisinier'] = async ({ prenom, nom, pin }) => {
    const rid = requireResto();
    const { hash, salt } = await hashPin(pin);
    const ref = await addDoc(collection(db, 'restaurants', rid, 'cuisiniers'), {
      prenom: prenom.trim(),
      nom: nom.trim(),
      pinHash: hash,
      pinSalt: salt,
      actif: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateCuisinier: UseCuisiniersResult['updateCuisinier'] = async (cid, input) => {
    const rid = requireResto();
    type CuisinierPatch = {
      [key: string]: unknown;
      updatedAt: ReturnType<typeof serverTimestamp>;
      prenom?: string;
      nom?: string;
      pinHash?: string;
      pinSalt?: string;
    };
    const patch: CuisinierPatch = { updatedAt: serverTimestamp() };
    if (input.prenom !== undefined) patch.prenom = input.prenom.trim();
    if (input.nom !== undefined) patch.nom = input.nom.trim();
    if (input.pin !== undefined) {
      const { hash, salt } = await hashPin(input.pin);
      patch.pinHash = hash;
      patch.pinSalt = salt;
    }
    await updateDoc(doc(db, 'restaurants', rid, 'cuisiniers', cid), patch);
  };

  const toggleActif: UseCuisiniersResult['toggleActif'] = async (cid, actif) => {
    const rid = requireResto();
    await updateDoc(doc(db, 'restaurants', rid, 'cuisiniers', cid), {
      actif,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteCuisinier: UseCuisiniersResult['deleteCuisinier'] = async (cid) => {
    const rid = requireResto();
    await deleteDoc(doc(db, 'restaurants', rid, 'cuisiniers', cid));
  };

  const verifyCuisinierPin: UseCuisiniersResult['verifyCuisinierPin'] = async (cid, pin) => {
    const c = cuisiniers.find((x) => x.id === cid);
    if (!c || !c.actif) return false;
    return verifyPin(pin, c.pinHash, c.pinSalt);
  };

  return {
    cuisiniers,
    loading,
    error,
    addCuisinier,
    updateCuisinier,
    toggleActif,
    deleteCuisinier,
    verifyCuisinierPin,
  };
}
