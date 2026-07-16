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
import { productTemplateSchema, type ProductTemplate } from '@/lib/schemas';

export type ProductTemplateDoc = ProductTemplate & { id: string };

interface UseProductTemplatesResult {
  templates: ProductTemplateDoc[];
  loading: boolean;
  error: Error | null;
  addTemplate: (input: { nom: string; dlcDays: number }) => Promise<string>;
  updateTemplate: (pid: string, input: { nom?: string; dlcDays?: number }) => Promise<void>;
  deleteTemplate: (pid: string) => Promise<void>;
}

/**
 * Hook live sur la sous-collection productTemplates du restaurant donné.
 * Si `restaurantId` est null, le hook reste idle.
 *
 * Lecture autorisée pour gérant + cuisinier (claim).
 * Write réservé au gérant (rules Firestore).
 */
export function useProductTemplates(restaurantId: string | null): UseProductTemplatesResult {
  const [templates, setTemplates] = useState<ProductTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!restaurantId) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'restaurants', restaurantId, 'productTemplates'),
      orderBy('nom'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ProductTemplateDoc[] = [];
        for (const d of snap.docs) {
          const parsed = tryParseDoc(d, productTemplateSchema);
          if (parsed) list.push(parsed);
        }
        setTemplates(list);
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

  const addTemplate: UseProductTemplatesResult['addTemplate'] = async ({ nom, dlcDays }) => {
    const rid = requireResto();
    const cleanNom = nom.trim();
    if (!cleanNom) throw new Error('Nom du produit requis');
    if (dlcDays < 0 || dlcDays > 365 || !Number.isInteger(dlcDays)) {
      throw new Error('DLC jours doit être un entier entre 0 et 365');
    }
    const ref = await addDoc(collection(db, 'restaurants', rid, 'productTemplates'), {
      nom: cleanNom,
      dlcDays,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };

  const updateTemplate: UseProductTemplatesResult['updateTemplate'] = async (pid, input) => {
    const rid = requireResto();
    type Patch = {
      [key: string]: unknown;
      updatedAt: ReturnType<typeof serverTimestamp>;
      nom?: string;
      dlcDays?: number;
    };
    const patch: Patch = { updatedAt: serverTimestamp() };
    if (input.nom !== undefined) {
      const cleanNom = input.nom.trim();
      if (!cleanNom) throw new Error('Nom du produit requis');
      patch.nom = cleanNom;
    }
    if (input.dlcDays !== undefined) {
      if (input.dlcDays < 0 || input.dlcDays > 365 || !Number.isInteger(input.dlcDays)) {
        throw new Error('DLC jours doit être un entier entre 0 et 365');
      }
      patch.dlcDays = input.dlcDays;
    }
    await updateDoc(doc(db, 'restaurants', rid, 'productTemplates', pid), patch);
  };

  const deleteTemplate: UseProductTemplatesResult['deleteTemplate'] = async (pid) => {
    const rid = requireResto();
    await deleteDoc(doc(db, 'restaurants', rid, 'productTemplates', pid));
  };

  return { templates, loading, error, addTemplate, updateTemplate, deleteTemplate };
}
