/**
 * Tests unitaires : useCuisiniers
 *
 * Couvre les invariants critiques :
 * - addCuisinier envoie pinHash (hex) et PAS le PIN en clair à addDoc
 * - updateCuisinier avec un nouveau pin re-hash et met pinHash dans le patch
 * - addCuisinier throw si pas de restaurantId courant
 *
 * Les tests d'intégration Firestore (rules, snapshot temps réel) sont couverts
 * par les tests rules + validation manuelle en emulator.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  addDoc: mocks.addDoc,
  updateDoc: mocks.updateDoc,
  deleteDoc: mocks.deleteDoc,
  onSnapshot: mocks.onSnapshot,
  collection: () => ({}),
  doc: () => ({}),
  orderBy: () => ({}),
  query: () => ({}),
  serverTimestamp: () => '__serverTimestamp__',
}));

import { useCuisiniers } from './useCuisiniers';

interface CuisinierPayload {
  prenom?: string;
  nom?: string;
  actif?: boolean;
  pinHash?: string;
  pinSalt?: string;
  [key: string]: unknown;
}

function lastPayload(mock: ReturnType<typeof vi.fn>): CuisinierPayload {
  const calls = mock.mock.calls;
  const last = calls[calls.length - 1];
  if (!last || last.length < 2) {
    throw new Error('Mock not called or missing payload arg');
  }
  return last[1] as CuisinierPayload;
}

beforeEach(() => {
  mocks.addDoc.mockReset().mockResolvedValue({ id: 'new-id' });
  mocks.updateDoc.mockReset().mockResolvedValue(undefined);
  mocks.deleteDoc.mockReset().mockResolvedValue(undefined);
  mocks.onSnapshot.mockReset().mockImplementation(() => () => undefined);
});

describe('useCuisiniers — invariants sécurité PIN', () => {
  it('addCuisinier envoie pinHash hex (64 chars) et PAS le PIN en clair', async () => {
    const { result } = renderHook(() => useCuisiniers('r1'));
    await act(async () => {
      await result.current.addCuisinier({ prenom: 'Nathan', nom: 'Dupont', pin: '1234' });
    });

    expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    const payload = lastPayload(mocks.addDoc);
    expect(payload.prenom).toBe('Nathan');
    expect(payload.nom).toBe('Dupont');
    expect(payload.actif).toBe(true);
    expect(payload.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(payload.pinSalt).toMatch(/^[0-9a-f]{32}$/);
    // anti-régression : surtout pas le PIN en clair
    expect(JSON.stringify(payload)).not.toContain('"pin":"1234"');
    expect(JSON.stringify(payload)).not.toContain('"pin":');
  });

  it('updateCuisinier avec nouveau pin re-hash et met pinHash dans le patch', async () => {
    const { result } = renderHook(() => useCuisiniers('r1'));
    await act(async () => {
      await result.current.updateCuisinier('c1', { prenom: 'Marc', pin: '5678' });
    });

    expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
    const patch = lastPayload(mocks.updateDoc);
    expect(patch.prenom).toBe('Marc');
    expect(patch.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(patch.pinSalt).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(patch)).not.toContain('"pin":"5678"');
  });

  it('updateCuisinier sans pin ne touche pas pinHash/pinSalt', async () => {
    const { result } = renderHook(() => useCuisiniers('r1'));
    await act(async () => {
      await result.current.updateCuisinier('c1', { prenom: 'Marc' });
    });

    const patch = lastPayload(mocks.updateDoc);
    expect(patch.pinHash).toBeUndefined();
    expect(patch.pinSalt).toBeUndefined();
    expect(patch.prenom).toBe('Marc');
  });

  it('addCuisinier throw si pas de restaurantId courant', async () => {
    const { result } = renderHook(() => useCuisiniers(null));
    await expect(
      result.current.addCuisinier({ prenom: 'X', nom: 'Y', pin: '1234' }),
    ).rejects.toThrow(/Aucun restaurant courant/);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });

  it("addCuisinier propage l'erreur si PIN invalide", async () => {
    const { result } = renderHook(() => useCuisiniers('r1'));
    await expect(
      result.current.addCuisinier({ prenom: 'X', nom: 'Y', pin: 'abc' }),
    ).rejects.toThrow(/PIN invalide/);
    expect(mocks.addDoc).not.toHaveBeenCalled();
  });
});
