import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Étiquette DLC imprimée (ou téléchargée en PDF tant que l'imprimante n'est pas livrée).
 * Donnée HACCP — trace chaque étiquette générée (immutable Firestore).
 *
 * - `prodDate` : date production saisie par le cuisinier (ISO date string)
 * - `dlc` : date limite consommation calculée (prodDate + template.dlcDays)
 * - `qte` : nombre d'étiquettes générées (>= 1)
 * - `createdBy` : identité métier cuisinierId
 *
 * Path Firestore : restaurants/{rid}/etiquettes/{eid}
 * Immutable : allow update, delete: if false.
 */
export const etiquetteSchema = z.object({
  produit: z.string().min(1),
  prodDate: z.string().min(1),
  dlc: z.string().min(1),
  lot: z.string().optional(),
  qte: z.number().int().min(1),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
});

export type Etiquette = z.infer<typeof etiquetteSchema>;
