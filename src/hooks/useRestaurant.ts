import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { parseDoc } from '@/lib/firestore';
import { restaurantSchema, type Restaurant } from '@/lib/schemas';
import { hashPin, verifyPin } from '@/lib/pin';
import { useAuth } from './useAuth';

interface UseRestaurantResult {
  restaurant: (Restaurant & { id: string }) | null;
  restaurantId: string | null;
  loading: boolean;
  error: Error | null;
  createRestaurant: (input: {
    nom: string;
    adresse?: string;
    managerPin: string;
  }) => Promise<string>;
  updateRestaurant: (partial: Partial<Pick<Restaurant, 'nom' | 'adresse'>>) => Promise<void>;
  updateManagerPin: (newPin: string) => Promise<void>;
  verifyManagerPin: (pin: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

export function useRestaurant(): UseRestaurantResult {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<(Restaurant & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Compteur de génération pour annuler les setStates d'un load() obsolète
  // (cas : user change pendant un load en cours, on évite d'écraser le state du nouveau user).
  const loadGenRef = useRef(0);

  const load = async (currentUser: User | null) => {
    const myGen = ++loadGenRef.current;
    const isStale = () => loadGenRef.current !== myGen;

    setLoading(true);
    setError(null);
    if (!currentUser) {
      if (isStale()) return;
      setRestaurant(null);
      setLoading(false);
      return;
    }
    try {
      const tokenResult = await currentUser.getIdTokenResult();
      if (isStale()) return;
      const claimRid = tokenResult.claims['restaurantId'];
      if (typeof claimRid === 'string' && claimRid.length > 0) {
        const ref = doc(db, 'restaurants', claimRid);
        const snap = await getDoc(ref);
        if (isStale()) return;
        setRestaurant(snap.exists() ? parseDoc(snap, restaurantSchema) : null);
      } else {
        const q = query(collection(db, 'restaurants'), where('ownerUid', '==', currentUser.uid));
        const snap = await getDocs(q);
        if (isStale()) return;
        const first = snap.docs[0];
        setRestaurant(first ? parseDoc(first, restaurantSchema) : null);
      }
    } catch (err) {
      if (isStale()) return;
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      if (!isStale()) setLoading(false);
    }
  };

  useEffect(() => {
    // Sync du state avec la session Firebase Auth : pattern légitime pour
    // (re)charger le restaurant à chaque changement d'utilisateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(user);
  }, [user]);

  const createRestaurant: UseRestaurantResult['createRestaurant'] = async ({
    nom,
    adresse,
    managerPin,
  }) => {
    // Lit auth.currentUser direct pour éviter la race condition signUp → createRestaurant
    // (le state `user` du hook peut être encore null entre les deux awaits).
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Non authentifié');
    if (restaurant) throw new Error('Un restaurant existe déjà pour ce compte');
    const { hash, salt } = await hashPin(managerPin);
    const ref = doc(collection(db, 'restaurants'));
    const data = {
      nom,
      ownerUid: currentUser.uid,
      ...(adresse ? { adresse } : {}),
      managerPinHash: hash,
      managerPinSalt: salt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    await load(currentUser);
    return ref.id;
  };

  const updateRestaurant: UseRestaurantResult['updateRestaurant'] = async (partial) => {
    if (!restaurant) throw new Error('Aucun restaurant chargé');
    const ref = doc(db, 'restaurants', restaurant.id);
    await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
    if (user) await load(user);
  };

  const updateManagerPin: UseRestaurantResult['updateManagerPin'] = async (newPin) => {
    if (!restaurant) throw new Error('Aucun restaurant chargé');
    const { hash, salt } = await hashPin(newPin);
    const ref = doc(db, 'restaurants', restaurant.id);
    await updateDoc(ref, {
      managerPinHash: hash,
      managerPinSalt: salt,
      updatedAt: serverTimestamp(),
    });
    if (user) await load(user);
  };

  const verifyManagerPin: UseRestaurantResult['verifyManagerPin'] = async (pin) => {
    if (!restaurant) return false;
    return verifyPin(pin, restaurant.managerPinHash, restaurant.managerPinSalt);
  };

  const reload = async () => {
    await load(user);
  };

  return {
    restaurant,
    restaurantId: restaurant?.id ?? null,
    loading,
    error,
    createRestaurant,
    updateRestaurant,
    updateManagerPin,
    verifyManagerPin,
    reload,
  };
}
