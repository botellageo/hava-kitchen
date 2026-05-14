---
paths:
  - 'src/**/*.test.ts'
  - 'src/**/*.test.tsx'
  - 'src/__tests__/**'
  - 'vitest.config.ts'
---

# Testing — pms-midi5

## Stack tests (à installer quand on commence)

- **Vitest** : test runner (intègre nativement avec Vite)
- **@testing-library/react** : tests composants
- **@testing-library/user-event** : interactions utilisateur
- **@firebase/rules-unit-testing** : tests des Firestore Rules
- Pas de tests E2E pour l'instant (overkill solo dev)

## Conventions

### Localisation

- Tests unitaires (hooks, utils, schémas Zod) : `src/lib/<file>.test.ts` à côté du fichier testé
- Tests composants : `src/components/<Component>.test.tsx` à côté
- Tests rules : `tests/firestore.rules.test.ts` à la racine
- Pattern : Arrange → Act → Assert

### Tests Zod schemas

```ts
import { describe, it, expect } from 'vitest';
import { releveTemperatureSchema } from './releve_temperature';

describe('releveTemperatureSchema', () => {
  it('accepte un relevé valide', () => {
    expect(() =>
      releveTemperatureSchema.parse({
        equipement: 'frigo-1',
        temperature: 4,
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
        createdBy: 'uid-123',
      }),
    ).not.toThrow();
  });

  it('refuse un equipement vide', () => {
    expect(() => releveTemperatureSchema.parse({ equipement: '' /* ... */ })).toThrow();
  });
});
```

### Tests hooks Firestore

Mocker `firebase/firestore` (pas de Firebase réel en test).

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({
      docs: [
        /* mock docs */
      ],
    });
    return () => {}; // unsubscribe
  }),
}));
```

### Tests composants

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('affiche le formulaire de relevé', async () => {
  render(<AddReleveForm onSubmit={vi.fn()} />);
  expect(screen.getByLabelText(/équipement/i)).toBeInTheDocument();
});
```

### Tests Firestore Rules

```ts
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';

it("refuse l'update d'un relevé HACCP (immutable)", async () => {
  const env = await initializeTestEnvironment({
    /* ... */
  });
  const staff = env.authenticatedContext('staff-uid', { role: 'Staff' });
  const ref = staff.firestore().doc('releves_temperature/abc');
  await assertFails(ref.update({ temperature: 999 }));
});
```

## Règles

- **Pas de test qui dépend de Firebase réel** (toujours emulator ou mock)
- **Pas de `console.log`** dans les tests (utiliser les assertions)
- **Nommage descriptif** : `it('refuse un equipement vide')` plutôt que `it('test1')`
- **Tester les paths critiques** : schémas Zod, hooks Firestore, rules d'immutabilité HACCP
- **Pas de surface pour l'instant** : viser la couverture des chemins critiques, pas 100%
- Quand un bug est trouvé en prod → ajouter un test de régression avant de fixer
