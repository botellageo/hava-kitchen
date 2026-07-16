import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { assertOwnerOrCuisinier } from './auth';
import { ocrLabelImage, type OcrLabelResult } from './gemini';

const REGION = 'europe-west1';

interface OcrReceptionInput {
  restaurantId: string;
  /** Path Firebase Storage (sans gs:// ni bucket), ex: restaurants/r1/receptions/rec1/photo.jpg */
  storagePath: string;
}

type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

function detectMediaType(path: string): MediaType {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Cloud Function callable : OCR d'une photo d'étiquette fournisseur via Gemini (Vertex AI).
 *
 * Auth : owner du resto OU cuisinier authentifié (claim restaurantId).
 * Input : restaurantId + storagePath (path bucket Firebase Storage).
 * Output : OcrLabelResult ou throw HttpsError.
 *
 * Coût : < 0.001€ par photo (gemini-2.5-flash), facturé sur le projet GCP —
 * aucune clé API externe (ADC du compte de service).
 */
export const ocrReception = onCall<OcrReceptionInput>(
  { region: REGION },
  async (req): Promise<OcrLabelResult> => {
    const restaurantId = req.data?.restaurantId;
    const storagePath = req.data?.storagePath;
    if (!restaurantId || !storagePath) {
      throw new HttpsError('invalid-argument', 'restaurantId et storagePath requis');
    }

    await assertOwnerOrCuisinier(req, restaurantId);

    // Vérification : le path doit appartenir au restaurant courant (anti-attaque cross-resto).
    const expectedPrefix = `restaurants/${restaurantId}/receptions/`;
    if (!storagePath.startsWith(expectedPrefix)) {
      throw new HttpsError('invalid-argument', `storagePath doit commencer par ${expectedPrefix}`);
    }

    // Télécharger l'image depuis Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError('not-found', 'Photo introuvable dans Storage');
    }
    const [buffer] = await file.download();
    const imageBase64 = buffer.toString('base64');
    const mediaType = detectMediaType(storagePath);

    logger.info(`OCR start for ${storagePath} (${(buffer.length / 1024).toFixed(0)}kb)`);

    try {
      const result = await ocrLabelImage(imageBase64, mediaType);
      logger.info(`OCR done : produit="${result.produit}"`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR échec';
      logger.error('OCR failed', err);
      throw new HttpsError('internal', `OCR impossible : ${message}`);
    }
  },
);
