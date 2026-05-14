/**
 * Tests des Security Rules pour les relevés HACCP.
 *
 * Garantit que :
 * - Un relevé ne peut JAMAIS être modifié (update interdit)
 * - Un relevé ne peut JAMAIS être supprimé (delete interdit)
 * - Seul un user authentifié avec rôle Staff/Manager/Admin peut créer
 * - Le champ createdBy doit correspondre à l'auth.uid (anti-impersonation)
 *
 * Si l'un de ces tests échoue, NE JAMAIS DÉPLOYER en prod : c'est une
 * non-conformité réglementaire HACCP / DDPP.
 *
 * Lance avec : npm run test:rules
 * (le script démarre l'emulator Firestore avant les tests)
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

const PROJECT_ID = 'hava-kitchen-test';

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

async function seedStaffUser(uid: string): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      email: `${uid}@test.local`,
      role: 'Staff',
    });
  });
}

describe('firestore.rules — releves_temperature (HACCP)', () => {
  it('refuse la lecture si non authentifié', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(anon.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'anon',
      }),
    );
  });

  it('refuse la création si pas de rôle Staff/Manager/Admin', async () => {
    const ctx = testEnv.authenticatedContext('user-without-role');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'user-without-role',
      }),
    );
  });

  it('autorise la création par un Staff avec createdBy = auth.uid', async () => {
    await seedStaffUser('staff-1');
    const ctx = testEnv.authenticatedContext('staff-1');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'staff-1',
      }),
    );
  });

  it('refuse la création si createdBy ≠ auth.uid (anti-impersonation)', async () => {
    await seedStaffUser('staff-1');
    const ctx = testEnv.authenticatedContext('staff-1');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'staff-2', // tentative d'usurpation
      }),
    );
  });

  it('IMMUTABILITÉ : refuse TOUTE modification (update)', async () => {
    await seedStaffUser('staff-1');

    // Seed un relevé existant via le bypass des rules
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'staff-1',
      });
    });

    const ctx = testEnv.authenticatedContext('staff-1');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 999, // tentative de falsification
      }),
    );
  });

  it('IMMUTABILITÉ : refuse TOUTE suppression (delete)', async () => {
    await seedStaffUser('staff-1');

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'releves_temperature/r1'), {
        temperature: 4,
        equipement: 'frigo-1',
        createdAt: serverTimestamp(),
        createdBy: 'staff-1',
      });
    });

    const ctx = testEnv.authenticatedContext('staff-1');
    await assertFails(deleteDoc(doc(ctx.firestore(), 'releves_temperature/r1')));
  });
});
