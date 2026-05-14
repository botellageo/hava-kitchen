import { z } from 'zod';

/**
 * Session cuisinier persistée en localStorage côté iPad (post-PIN) et côté tel (post-pairing).
 * Schéma Zod pour valider la lecture du localStorage (corruption / migration).
 */
export const cuisinierSessionSchema = z.object({
  id: z.string().min(1),
  prenom: z.string().min(1),
  nom: z.string().min(1),
});

export type CuisinierSessionValidated = z.infer<typeof cuisinierSessionSchema>;
