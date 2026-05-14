/**
 * Cloud Functions — PMS Midi 5
 *
 * Pour activer le backup quotidien Firestore :
 * 1. Activer la facturation Blaze sur le projet Firebase (gratuit < quotas)
 * 2. Créer un bucket GCS pour les exports : gsutil mb gs://pms-midi5-backups
 * 3. Donner au service account Firebase le rôle "Cloud Datastore Import Export Admin"
 * 4. Déployer : npm run deploy
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();

// ─────────────────────────────────────────────────────────────
// Backup quotidien Firestore vers Cloud Storage
// Tourne tous les jours à 3h du matin (Europe/Paris)
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
        collectionIds: [], // [] = toutes les collections
      });
      logger.info(`Backup lancé : ${operation.name}`);
    } catch (error) {
      logger.error('Échec backup Firestore', error);
      throw error;
    }
  },
);
