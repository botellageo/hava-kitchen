/**
 * Tests des Security Rules pour `restaurants/{rid}/cuisiniers/{cid}`.
 *
 * Règle : seul le owner du restaurant parent peut CRUD ses cuisiniers.
 *
 * Couvre :
 * - read/create/update/delete par owner OK
 * - mêmes opérations refusées pour un autre user
 * - mêmes opérations refusées pour un anonyme
 * - cross-resto refusé (owner du resto A ne peut pas toucher cuisiniers du resto B)
 * - écriture client sur pairingTokens refusée (tout passe par CF)
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
const PROJECT_ID = 'hava-kitchen-test-cuisiniers';

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

function validCuisinierData() {
  return {
    prenom: 'Nathan',
    nom: 'Dupont',
    pinHash: 'a'.repeat(64),
    pinSalt: 'b'.repeat(32),
    actif: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

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

async function seedCuisinier(rid: string, cid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(
      doc(ctx.firestore(), `restaurants/${rid}/cuisiniers/${cid}`),
      validCuisinierData(),
    );
  });
}

describe('firestore.rules — restaurants/{rid}/cuisiniers/{cid}', () => {
  describe('owner du resto', () => {
    it('peut créer un cuisinier', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(
        setDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1'), validCuisinierData()),
      );
    });

    it('peut lire un cuisinier', async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(getDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1')));
    });

    it('peut désactiver un cuisinier (update)', async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(
        updateDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1'), {
          actif: false,
          updatedAt: serverTimestamp(),
        }),
      );
    });

    it('peut supprimer un cuisinier (hard delete autorisé en it.1)', async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.authenticatedContext('jb');
      await assertSucceeds(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1')));
    });
  });

  describe('autre user authentifié', () => {
    it("ne peut pas créer un cuisinier dans un resto qui n'est pas le sien", async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('autre-user');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1'), validCuisinierData()),
      );
    });

    it("ne peut pas lire les cuisiniers d'un autre resto", async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.authenticatedContext('autre-user');
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1')));
    });

    it("ne peut pas supprimer les cuisiniers d'un autre resto", async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.authenticatedContext('autre-user');
      await assertFails(deleteDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1')));
    });
  });

  describe('anonyme', () => {
    it('ne peut pas lire les cuisiniers', async () => {
      await seedRestaurant('r1', 'jb');
      await seedCuisinier('r1', 'c1');
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1')));
    });

    it('ne peut pas créer un cuisinier', async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.unauthenticatedContext();
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/r1/cuisiniers/c1'), validCuisinierData()),
      );
    });
  });

  describe('cross-resto', () => {
    it('owner du resto A ne peut pas toucher les cuisiniers du resto B', async () => {
      await seedRestaurant('rA', 'jb');
      await seedRestaurant('rB', 'autre-gerant');
      await seedCuisinier('rB', 'c1');
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/rB/cuisiniers/c1')));
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/rB/cuisiniers/c2'), validCuisinierData()),
      );
    });
  });

  describe('pairingTokens (sub) — tout passe par CF', () => {
    it("refuse l'écriture client (même par owner)", async () => {
      await seedRestaurant('r1', 'jb');
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(
        setDoc(doc(ctx.firestore(), 'restaurants/r1/pairingTokens/t1'), {
          cuisinierId: 'c1',
          expiresAt: serverTimestamp(),
        }),
      );
    });

    it('refuse la lecture client (même par owner)', async () => {
      await seedRestaurant('r1', 'jb');
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'restaurants/r1/pairingTokens/t1'), {
          cuisinierId: 'c1',
          expiresAt: serverTimestamp(),
        });
      });
      const ctx = testEnv.authenticatedContext('jb');
      await assertFails(getDoc(doc(ctx.firestore(), 'restaurants/r1/pairingTokens/t1')));
    });
  });
});
