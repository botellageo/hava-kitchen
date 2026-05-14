import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

  const load = async (uid: string | null) => {
    setLoading(true);
    setError(null);
    if (!uid) {
      setRestaurant(null);
      setLoading(false);
      return;
    }
    try {
      const q = query(collection(db, 'restaurants'), where('ownerUid', '==', uid));
      const snap = await getDocs(q);
      const first = snap.docs[0];
      setRestaurant(first ? parseDoc(first, restaurantSchema) : null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur de chargement'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync du state avec la session Firebase Auth : pattern légitime pour
    // (re)charger le restaurant à chaque changement d'utilisateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(user?.uid ?? null);
  }, [user]);

  const createRestaurant: UseRestaurantResult['createRestaurant'] = async ({
    nom,
    adresse,
    managerPin,
  }) => {
    if (!user) throw new Error('Non authentifié');
    if (restaurant) throw new Error('Un restaurant existe déjà pour ce compte');
    const { hash, salt } = await hashPin(managerPin);
    const ref = doc(collection(db, 'restaurants'));
    const data = {
      nom,
      ownerUid: user.uid,
      ...(adresse ? { adresse } : {}),
      managerPinHash: hash,
      managerPinSalt: salt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    await load(user.uid);
    return ref.id;
  };

  const updateRestaurant: UseRestaurantResult['updateRestaurant'] = async (partial) => {
    if (!restaurant) throw new Error('Aucun restaurant chargé');
    const ref = doc(db, 'restaurants', restaurant.id);
    await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() });
    if (user) await load(user.uid);
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
    if (user) await load(user.uid);
  };

  const verifyManagerPin: UseRestaurantResult['verifyManagerPin'] = async (pin) => {
    if (!restaurant) return false;
    return verifyPin(pin, restaurant.managerPinHash, restaurant.managerPinSalt);
  };

  const reload = async () => {
    if (user) await load(user.uid);
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
