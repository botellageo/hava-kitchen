import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, isValidPinFormat } from './pin';

describe('isValidPinFormat', () => {
  it.each(['1234', '12345', '123456'])('accepte %s', (pin) => {
    expect(isValidPinFormat(pin)).toBe(true);
  });

  it.each(['123', '1234567', '12a4', '', '1234 ', ' 1234'])('refuse "%s"', (pin) => {
    expect(isValidPinFormat(pin)).toBe(false);
  });
});

describe('hashPin', () => {
  it('retourne hash 64 hex chars et salt 32 hex chars', async () => {
    const { hash, salt } = await hashPin('1234');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it('génère un salt différent à chaque appel (hash différent)', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it('throw si PIN invalide', async () => {
    await expect(hashPin('abc')).rejects.toThrow(/PIN invalide/);
    await expect(hashPin('')).rejects.toThrow(/PIN invalide/);
    await expect(hashPin('1234567')).rejects.toThrow(/PIN invalide/);
  });
});

describe('verifyPin', () => {
  it('retourne true si bon PIN', async () => {
    const { hash, salt } = await hashPin('567890');
    expect(await verifyPin('567890', hash, salt)).toBe(true);
  });

  it('retourne false si mauvais PIN', async () => {
    const { hash, salt } = await hashPin('1234');
    expect(await verifyPin('9999', hash, salt)).toBe(false);
  });

  it('retourne false si PIN de format invalide (ne throw pas)', async () => {
    const { hash, salt } = await hashPin('1234');
    expect(await verifyPin('abc', hash, salt)).toBe(false);
    expect(await verifyPin('', hash, salt)).toBe(false);
  });

  it('retourne false si salt corrompu (hex invalide)', async () => {
    const { hash } = await hashPin('1234');
    expect(await verifyPin('1234', hash, 'zzzz')).toBe(false);
  });
});
