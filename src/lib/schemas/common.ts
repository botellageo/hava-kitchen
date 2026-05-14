import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Schéma Zod pour les Timestamps Firestore.
 * Accepte les Timestamps natifs ET les objets avec toDate() (cas onSnapshot).
 */
export const timestampSchema = z.custom<Timestamp>(
  (val) => val instanceof Timestamp || (typeof val === 'object' && val !== null && 'toDate' in val),
  { message: 'Timestamp Firestore attendu' },
);

/** Schéma de base : tout doc Firestore a un createdAt et updatedAt */
export const baseDocSchema = z.object({
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});
