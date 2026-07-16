import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {} }));

const { monthBounds } = await import('@/lib/registreData');
const { formatMoisFr } = await import('@/lib/generateRegistrePdf');

describe('monthBounds', () => {
  it('borne un mois standard (start inclus, end exclu)', () => {
    const { start, end } = monthBounds('2026-07');
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6); // juillet (0-indexé)
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(7); // août
    expect(end.getDate()).toBe(1);
  });

  it('gère le passage d’année en décembre', () => {
    const { start, end } = monthBounds('2026-12');
    expect(start.getMonth()).toBe(11);
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(0); // janvier
  });

  it('refuse un format invalide', () => {
    expect(() => monthBounds('2026-7')).toThrow();
    expect(() => monthBounds('juillet 2026')).toThrow();
    expect(() => monthBounds('2026-13')).toThrow();
    expect(() => monthBounds('2026-00')).toThrow();
  });
});

describe('formatMoisFr', () => {
  it('formate une clé YYYY-MM en français', () => {
    expect(formatMoisFr('2026-07')).toBe('juillet 2026');
    expect(formatMoisFr('2026-02')).toBe('février 2026');
  });

  it('retourne la chaîne brute si format inattendu', () => {
    expect(formatMoisFr('n/a')).toBe('n/a');
  });
});
