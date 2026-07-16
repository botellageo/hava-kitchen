import { z } from 'zod';
import { timestampSchema } from './common';

/**
 * Équipement froid configurable par le gérant (config, PAS un relevé HACCP → mutable).
 * - `type` : pilote l'icône et les seuils par défaut à l'ajout
 * - `seuilMin`/`seuilMax` : bornes d'alerte en °C (futur module Températures)
 * - `sondeId` : identifiant de la sonde physique (optionnel tant que non livrées)
 *
 * Path Firestore : restaurants/{rid}/equipements/{eid}
 * Mutable (gérant peut modifier ou supprimer).
 */
export const equipementSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(['frigo', 'congelateur', 'autre']),
  seuilMin: z.number(),
  seuilMax: z.number(),
  sondeId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Equipement = z.infer<typeof equipementSchema>;
