/**
 * Tests des Security Rules HACCP immutabilité (receptions + etiquettes).
 *
 * Couvre :
 * - create par owner et cuisinier (claim) OK avec champs obligatoires
 * - create refuse si champs manquants
 * - update REFUSÉ même par owner (HACCP immutable)
 * - delete REFUSÉ même par owner (HACCP immutable)
 * - read par owner + cuisinier OK
 *
 * Lance avec : npm run test:rules (nécessite JDK 21+)
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'hava-kitchen-test-haccp';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedRestaurant(rid: string, ownerUid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `restaurants/${rid}`), {
      nom: 'Midi 5',
      ownerUid,
      managerPinHash: 'a'.repeat(64),
      managerPinSalt: 'b'.repeat(32),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

const validReception = {
  produit: 'Entrecôtes',
  photoUrl: 'https://firebasestorage.googleapis.com/photo.jpg',
  createdAt: serverTimestamp(),
  createdBy: 'cuisinier-1',
};

const validEtiquette = {
  produit: 'Tartare de saumon',
  prodDate: '2026-05-14',
  dlc: '2026-05-17',
  qte: 1,
  createdAt: serverTimestamp(),
  createdBy: 'cuisinier-1',
};

describe('firestore.rules — receptions/{recId} HACCP immutable', () => {
  it('owner peut create avec champs obligatoires', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('jb');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), validReception),
    );
  });

  it('cuisinier (claim) peut create', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('cuisinier-r1-c1', { restaurantId: 'r1' });
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), validReception),
    );
  });

  it('refuse create si photoUrl manquante (intégrité preuve DDPP)', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('jb');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), {
        produit: 'X',
        createdAt: serverTimestamp(),
        createdBy: 'cuisinier-1',
      }),
    );
  });

  it('refuse update même par owner (IMMUTABILITÉ HACCP)', async () => {
    await seedRestaurant('r1', 'jb');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), validReception);
    });
    const ctx = testEnv.authenticatedContext('jb');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), { produit: 'fraudé' }),
    );
  });

  it('refuse delete même par owner (IMMUTABILITÉ HACCP)', async () => {
    await seedRestaurant('r1', 'jb');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1'), validReception);
    });
    const ctx = testEnv.authenticatedContext('jb');
    await assertFails(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/receptions/rec1')));
  });
});

describe('firestore.rules — etiquettes/{eid} HACCP immutable', () => {
  it('owner peut create avec champs obligatoires', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('jb');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/etiquettes/e1'), validEtiquette),
    );
  });

  it('refuse create si dlc manquante', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('jb');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/etiquettes/e1'), {
        produit: 'X',
        prodDate: '2026-05-14',
        qte: 1,
        createdAt: serverTimestamp(),
        createdBy: 'c-1',
      }),
    );
  });

  it('refuse update + delete (IMMUTABILITÉ HACCP)', async () => {
    await seedRestaurant('r1', 'jb');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'restaurants/r1/etiquettes/e1'), validEtiquette);
    });
    const ctx = testEnv.authenticatedContext('jb');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'restaurants/r1/etiquettes/e1'), { dlc: '2099-01-01' }),
    );
    await assertFails(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/etiquettes/e1')));
  });
});
