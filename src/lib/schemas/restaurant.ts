import { z } from 'zod';
import { timestampSchema } from './common';

export const restaurantSchema = z.object({
  nom: z.string().min(1),
  ownerUid: z.string().min(1),
  adresse: z.string().optional(),
  managerPinHash: z.string().min(1),
  managerPinSalt: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type Restaurant = z.infer<typeof restaurantSchema>;
