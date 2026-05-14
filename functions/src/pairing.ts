import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { requireAuthedUid, assertRestoOwner } from './auth';

const TOKEN_TTL_MS = 5 * 60 * 1000;
const REGION = 'europe-west1';

interface PairingTokenDoc {
  cuisinierId: string;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  usedAt: admin.firestore.Timestamp | null;
}

interface CreatePairingTokenInput {
  restaurantId: string;
  cuisinierId: string;
}

/**
 * Génère un pairing token éphémère (5 min, usage unique) pour le cuisinier donné.
 * Appelée depuis l'iPad par le gérant (auth Firebase requise + ownership du resto).
 */
export const createPairingToken = onCall<CreatePairingTokenInput>(
  { region: REGION },
  async (req) => {
    const uid = requireAuthedUid(req);
    const restaurantId = req.data?.restaurantId;
    const cuisinierId = req.data?.cuisinierId;
    if (!restaurantId || !cuisinierId) {
      throw new HttpsError('invalid-argument', 'restaurantId et cuisinierId requis');
    }

    await assertRestoOwner(uid, restaurantId);

    const cuisinierRef = admin
      .firestore()
      .doc(`restaurants/${restaurantId}/cuisiniers/${cuisinierId}`);
    const cuisinierSnap = await cuisinierRef.get();
    if (!cuisinierSnap.exists) {
      throw new HttpsError('not-found', 'Cuisinier inconnu');
    }
    if (cuisinierSnap.data()?.actif !== true) {
      throw new HttpsError('failed-precondition', 'Cuisinier désactivé');
    }

    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + TOKEN_TTL_MS);

    const tokenRef = await admin
      .firestore()
      .collection(`restaurants/${restaurantId}/pairingTokens`)
      .add({
        cuisinierId,
        createdAt: now,
        expiresAt,
        usedAt: null,
      } satisfies PairingTokenDoc);

    return { tokenId: tokenRef.id, expiresAt: expiresAt.toMillis() };
  },
);

interface RedeemPairingTokenInput {
  restaurantId: string;
  tokenId: string;
}

/**
 * Échange un pairing token contre un custom token Firebase.
 * Appelée depuis le téléphone du cuisinier (pas d'auth requise — le token EST la preuve).
 * Le token est marqué `usedAt` en transaction pour empêcher la double redemption.
 */
export const redeemPairingToken = onCall<RedeemPairingTokenInput>(
  { region: REGION },
  async (req) => {
    const restaurantId = req.data?.restaurantId;
    const tokenId = req.data?.tokenId;
    if (!restaurantId || !tokenId) {
      throw new HttpsError('invalid-argument', 'restaurantId et tokenId requis');
    }

    const tokenRef = admin.firestore().doc(`restaurants/${restaurantId}/pairingTokens/${tokenId}`);

    const cuisinierId = await admin.firestore().runTransaction<string>(async (tx) => {
      const snap = await tx.get(tokenRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Token inconnu');
      }
      const data = snap.data() as PairingTokenDoc | undefined;
      if (!data) {
        throw new HttpsError('not-found', 'Token vide');
      }
      if (data.usedAt) {
        throw new HttpsError('failed-precondition', 'Token déjà utilisé');
      }
      const nowMs = Date.now();
      if (data.expiresAt.toMillis() < nowMs) {
        throw new HttpsError('deadline-exceeded', 'Token expiré');
      }
      tx.update(tokenRef, { usedAt: admin.firestore.Timestamp.now() });
      return data.cuisinierId;
    });

    const cuisinierUid = `cuisinier-${restaurantId}-${cuisinierId}`;
    const customToken = await admin.auth().createCustomToken(cuisinierUid, {
      restaurantId,
      cuisinierId,
      role: 'cuisinier',
    });

    return { customToken };
  },
);
