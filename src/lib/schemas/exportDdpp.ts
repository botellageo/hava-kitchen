import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Trace d'un export registre DDPP (create-only : preuve qu'un export a été produit).
 * Le PDF n'est pas stocké — il est regénéré à la demande depuis les données
 * immutables (receptions + etiquettes), ce qui garantit sa fidélité.
 *
 * - `mois` : période couverte au format YYYY-MM
 * - `nbReceptions` / `nbEtiquettes` : volumes inclus dans le registre au moment de l'export
 * - `createdBy` : identité du gérant (email)
 *
 * Path Firestore : restaurants/{rid}/exportsDdpp/{xid}
 * Immutable : allow update, delete: if false.
 */
export const exportDdppSchema = z.object({
  mois: z.string().regex(/^\d{4}-\d{2}$/),
  nbReceptions: z.number().int().min(0),
  nbEtiquettes: z.number().int().min(0),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
});

export type ExportDdpp = z.infer<typeof exportDdppSchema>;
