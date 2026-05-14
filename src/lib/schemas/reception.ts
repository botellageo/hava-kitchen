import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Réception fournisseur — donnée HACCP critique (immutable Firestore).
 * - `photoUrl` : preuve photo (Firebase Storage, conservation 3 ans pour DDPP)
 * - `createdBy` : identité métier du cuisinier (champ string, pas auth.uid)
 *
 * Les champs OCR (fournisseur/lot/qte/dlc/notes) sont optionnels car
 * l'IA peut ne pas les extraire et le cuisinier peut valider sans.
 *
 * Path Firestore : restaurants/{rid}/receptions/{rid_id}
 * Immutable : allow update, delete: if false.
 */
export const receptionSchema = z.object({
  produit: z.string().min(1),
  fournisseur: z.string().optional(),
  lot: z.string().optional(),
  qte: z.string().optional(),
  dlc: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().min(1),
  createdAt: timestampSchema,
  createdBy: z.string().min(1),
});

export type Reception = z.infer<typeof receptionSchema>;
