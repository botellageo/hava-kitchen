import { z } from 'zod';

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string().min(1, 'VITE_FIREBASE_API_KEY manquant'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  VITE_USE_EMULATOR: z.enum(['true', 'false']).optional().default('false'),
  VITE_SENTRY_DSN: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error('❌ Configuration .env invalide :', parsed.error.flatten().fieldErrors);
  throw new Error(
    "Variables d'environnement manquantes ou invalides. Copier .env.example en .env.local et remplir.",
  );
}

export const env = {
  ...parsed.data,
  USE_EMULATOR: parsed.data.VITE_USE_EMULATOR === 'true',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};
