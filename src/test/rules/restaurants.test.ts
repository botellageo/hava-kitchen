/**
 * Tests des Security Rules pour la collection `restaurants/{rid}`.
 *
 * Couvre :
 * - read : seul le owner peut lire son resto
 * - create : un user authentifié peut créer un resto pour lui-même
 *            (anti-impersonation : ownerUid forcé == auth.uid)
 * - update : owner uniquement, ownerUid immutable (anti-takeover)
 * - delete : interdit en it.1
 *
 * Lance avec : npm run test:rules
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
const PROJECT_ID = 'hava-kitchen-test-restaurants';

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

function validRestaurantData(ownerUid: string) {
  return {
    nom: 'Midi 5',
    ownerUid,
    managerPinHash: 'a'.repeat(64),
    managerPinSalt: 'b'.repeat(32),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function seedRestaurant(rid: string, ownerUid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `restaurants/${rid}`), validRestaurantData(ownerUid));
  });
}

describe('firestore.rules — restaurants/{rid}', () => {
  describe('create', () => {
    it('autorise la création par un user authentifié qui se déclare owner', async () => {
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'restaurants/r1'), validRestaurantData('jb')),
      );
    });

    it('refuse la création si non authentifié', async () => {
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(setDoc(doc(ctx.firestore(), 'restaurants/r1'), validRestaurantData('jb')));
    });

    it('refuse la création si ownerUid != auth.uid (anti-impersonation)', async () => {
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/r1'), validRestaurantData('autre-user')),
      );
    });

    it('refuse la création si champs obligatoires manquants', async () => {
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/r1'), {
          nom: 'Midi 5',
          ownerUid: 'jb',
          // managerPinHash + managerPinSalt manquants
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      );
    });
  });

  describe('read', () => {
    it('autorise la lecture par le owner', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(getDoc(doc(ctx.firestore(), 'restaurants/r1')));
    });

    it('refuse la lecture par un autre user', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('autre-user');
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1')));
    });

    it('refuse la lecture par un user anonyme', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1')));
    });
  });

  describe('update', () => {
    it('autorise le owner à modifier nom/adresse', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(
        updateDoc(doc(ctx.firestore(), 'restaurants/r1'), {
          nom: 'Midi 5 — nouveau nom',
          adresse: '10 rue de la Cuisine',
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it("refuse l'update par un autre user", async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('autre-user');
      await assertFails(updateDoc(doc(ctx.firestore(), 'restaurants/r1'), { nom: 'Pirate' }));
    });

    it('refuse la tentative de changer ownerUid (anti-takeover)', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(
        updateDoc(doc(ctx.firestore(), 'restaurants/r1'), {
          ownerUid: 'autre-user',
        }),
      );
    });
  });

  describe('delete', () => {
    it('refuse la suppression par le owner (interdit en it.1)', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(deleteDoc(doc(ctx.firestore(), 'restaurants/r1')));
    });
  });
});
