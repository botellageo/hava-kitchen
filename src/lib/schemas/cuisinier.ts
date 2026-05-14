import { z } from 'zod';
import { timestampSchema } from './common';

export const cuisinierSchema = z.object({
  prenom: z.string().min(1),
  nom: z.string().min(1),
  pinHash: z.string().min(1),
  pinSalt: z.string().min(1),
  actif: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Cuisinier = z.infer<typeof cuisinierSchema>;
