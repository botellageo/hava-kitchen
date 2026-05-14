/**
 * Point d'entrée des schémas Zod pour les collections Firestore.
 *
 * RÈGLE : pour chaque collection Firestore, créer un schéma Zod ici
 * et l'utiliser systématiquement avec parseDoc() lors de la lecture.
 */

export * from './common';
export * from './restaurant';
export * from './cuisinier';
export * from './cuisinierSession';
