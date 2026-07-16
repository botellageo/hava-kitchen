import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

/**
 * Garde-fou : exige une session Firebase Auth.
 * Throw HttpsError 'unauthenticated' sinon.
 */
export function requireAuthedUid<T = unknown>(req: CallableRequest<T>): string {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Auth requise');
  }
  return req.auth.uid;
}

/**
 * Vérifie que `uid` est bien le owner du restaurant `restaurantId`.
 * Throw HttpsError sinon.
 */
export async function assertRestoOwner(uid: string, restaurantId: string): Promise<void> {
  const docRef = admin.firestore().doc(`restaurants/${restaurantId}`);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Restaurant inconnu');
  }
  const data = snap.data();
  if (!data || data.ownerUid !== uid) {
    throw new HttpsError('permission-denied', 'Pas owner de ce restaurant');
  }
}

/**
 * Vérifie que l'appelant a accès au restaurant : soit owner Firestore,
 * soit cuisinier authentifié via custom claim restaurantId.
 * Throw HttpsError sinon.
 */
export async function assertOwnerOrCuisinier<T = unknown>(
  req: CallableRequest<T>,
  restaurantId: string,
): Promise<void> {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Auth requise');
  }
  const claimRid = req.auth.token['restaurantId'];
  if (typeof claimRid === 'string' && claimRid === restaurantId) {
    return; // cuisinier authentifié via custom claim
  }
  await assertRestoOwner(req.auth.uid, restaurantId);
}
