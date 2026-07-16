import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Template produit configurable par le gérant.
 * - `nom` : libellé affiché à l'écran et imprimé sur l'étiquette
 * - `dlcDays` : nombre de jours avant DLC (entre 0 et 365)
 *
 * Utilisé par :
 * - Module Étiquettes DLC (sélection produit → calcul DLC = prodDate + dlcDays)
 *
 * Path Firestore : restaurants/{rid}/productTemplates/{pid}
 * Mutable (gérant peut modifier ou supprimer).
 */
export const productTemplateSchema = z.object({
  nom: z.string().min(1),
  dlcDays: z.number().int().min(0).max(365),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type ProductTemplate = z.infer<typeof productTemplateSchema>;
