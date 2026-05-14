import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import type { z } from 'zod';

/**
 * Parse un document Firestore avec un schéma Zod.
 * Si le doc ne respecte pas le schéma, log l'erreur en détail et throw.
 *
 * Utiliser systématiquement à la place de `snap.data()` pour garantir
 * qu'on ne lit jamais une donnée mal formée silencieusement.
 */
export function parseDoc<T extends z.ZodObject<z.ZodRawShape>>(
  snap: DocumentSnapshot | QueryDocumentSnapshot,
  schema: T,
): z.infer<T> & { id: string } {
  const raw = snap.data();
  const result = schema.safeParse(raw);

  if (!result.success) {
    console.error(
      `❌ Document Firestore invalide : ${snap.ref.path}`,
      result.error.flatten().fieldErrors,
      raw,
    );
    throw new Error(`Document invalide à ${snap.ref.path}`);
  }

  return { id: snap.id, ...result.data };
}

/**
 * Variante "safe" qui retourne null au lieu de throw.
 * À utiliser quand on préfère ignorer les docs corrompus plutôt que crasher.
 */
export function tryParseDoc<T extends z.ZodObject<z.ZodRawShape>>(
  snap: DocumentSnapshot | QueryDocumentSnapshot,
  schema: T,
): (z.infer<T> & { id: string }) | null {
  const raw = snap.data();
  const result = schema.safeParse(raw);

  if (!result.success) {
    console.warn(
      `⚠️ Document Firestore ignoré (invalide) : ${snap.ref.path}`,
      result.error.flatten().fieldErrors,
    );
    return null;
  }

  return { id: snap.id, ...result.data };
}
