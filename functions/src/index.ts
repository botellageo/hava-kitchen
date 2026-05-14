/**
 * Cloud Functions — PMS Midi 5
 *
 * Exports :
 * - createPairingToken / redeemPairingToken (it.1) : flow QR pairing téléphone cuisinier
 * - dailyFirestoreBackup (futur) : backup quotidien Firestore vers Cloud Storage
 *
 * Plan Blaze requis (CF callables + scheduled).
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

admin.initializeApp();

export { createPairingToken, redeemPairingToken } from './pairing';

// ─────────────────────────────────────────────────────────────
// Backup quotidien Firestore vers Cloud Storage
// Tourne tous les jours à 3h du matin (Europe/Paris)
// À activer une fois le bucket pms-midi5-backups créé.
// ─────────────────────────────────────────────────────────────
export const dailyFirestoreBackup = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'Europe/Paris',
    region: 'europe-west1',
    retryCount: 3,
  },
  async () => {
    const projectId = process.env['GCLOUD_PROJECT'];
    if (!projectId) {
      logger.error('GCLOUD_PROJECT non défini');
      return;
    }

    const bucket = `gs://${projectId}-backups`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputUriPrefix = `${bucket}/firestore/${timestamp}`;

    logger.info(`Démarrage backup Firestore → ${outputUriPrefix}`);

    try {
      const client = new (await import('@google-cloud/firestore')).v1.FirestoreAdminClient();
      const [operation] = await client.exportDocuments({
        name: client.databasePath(projectId, '(default)'),
        outputUriPrefix,
        collectionIds: [],
      });
      logger.info(`Backup lancé : ${operation.name}`);
    } catch (error) {
      logger.error('Échec backup Firestore', error);
      throw error;
    }
  },
);
