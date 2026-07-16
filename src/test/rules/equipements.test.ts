/**
 * Tests des Security Rules pour `restaurants/{rid}/equipements/{eid}`.
 *
 * Couvre :
 * - read : owner + cuisinier (claim) OK, autres refusés
 * - write (create/update/delete) : owner uniquement, cuisinier refusé
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
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'hava-kitchen-test-equipements';

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

async function seedEquipement(rid: string, eid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `restaurants/${rid}/equipements/${eid}`), {
      nom: 'Frigo positif 1',
      type: 'frigo',
      seuilMin: 0,
      seuilMax: 6,
      sondeId: '0xA1B2',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

describe('firestore.rules — equipements/{eid}', () => {
  it('owner peut create + update + delete', async () => {
    await seedRestaurant('r1', 'jb');
    const ctx = testEnv.authenticatedContext('jb');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1'), {
        nom: 'Congélateur',
        type: 'congelateur',
        seuilMin: -22,
        seuilMax: -18,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1'), { seuilMax: -17 }),
    );
    await assertSucceeds(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
  });

  it('owner peut lire', async () => {
    await seedRestaurant('r1', 'jb');
    await seedEquipement('r1', 'e1');
    const ctx = testEnv.authenticatedContext('jb');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
  });

  it('cuisinier (custom claim) peut lire mais pas écrire', async () => {
    await seedRestaurant('r1', 'jb');
    await seedEquipement('r1', 'e1');
    const ctx = testEnv.authenticatedContext('cuisinier-r1-c1', { restaurantId: 'r1' });
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
    await assertFails(
      setDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e2'), {
        nom: 'X',
        type: 'frigo',
        seuilMin: 0,
        seuilMax: 6,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1'), { seuilMax: 8 }),
    );
    await assertFails(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
  });

  it('refuse lecture par un user sans relation au resto', async () => {
    await seedRestaurant('r1', 'jb');
    await seedEquipement('r1', 'e1');
    const ctx = testEnv.authenticatedContext('autre-user');
    await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
  });

  it('refuse lecture par anon', async () => {
    await seedRestaurant('r1', 'jb');
    await seedEquipement('r1', 'e1');
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1/equipements/e1')));
  });
});
