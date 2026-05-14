---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
---

# React Conventions — pms-midi5

Stack : **React 19 + TypeScript strict + Vite + Tailwind 3 + React Router 7**

## Composants

- **Functional components uniquement** (pas de class)
- **Default export** pour les pages, **named export** pour les composants réutilisables
- Pas plus de **200 lignes** par composant → découper en sous-composants
- Pas de logique métier dans le JSX → l'extraire dans un **hook custom**
- Props typées explicitement (interface ou type), **pas de any**

```tsx
// src/components/ReleveCard.tsx
interface ReleveCardProps {
  releve: ReleveTemperature;
  onClick?: () => void;
}

export function ReleveCard({ releve, onClick }: ReleveCardProps) {
  return (
    <button onClick={onClick} className="rounded-lg border p-4">
      <p className="text-sm text-gray-500">{releve.equipement}</p>
      <p className="text-2xl font-bold">{releve.temperature}°C</p>
    </button>
  );
}
```

## Hooks custom

- Préfixés `use` (convention React)
- Un hook = une responsabilité
- Pas plus de **100 lignes** → extraire des helpers
- Toujours retourner un objet (pas un array) au-delà de 2 valeurs

```ts
// src/hooks/useRelevesTemperature.ts
export function useRelevesTemperature(equipementId?: string) {
  const [releves, setReleves] = useState<ReleveTemperature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // ... onSnapshot avec cleanup
    return () => unsubscribe();
  }, [equipementId]);

  return { releves, loading, error };
}
```

## TypeScript strict

- `strict: true` + `noUncheckedIndexedAccess: true` actifs
- **Pas de `any` explicite** (sauf dans un cast contrôlé, documenté avec commentaire)
- **Pas de `!`** (non-null assertion) sauf si garde évidente juste avant
- Préférer `unknown` à `any` puis narrow via type guard
- Utiliser les **types Zod** (`z.infer<typeof schema>`) au lieu de dupliquer

## Firebase

- **Import via `src/lib/firebase.ts` uniquement**. Jamais d'init parallèle.
- **Lecture** : toujours via `parseDoc()` / `tryParseDoc()` de `src/lib/firestore.ts`
- **Écriture** : input utilisateur validé via Zod **avant** `addDoc`/`setDoc`/`updateDoc`
- **try/catch** autour de tout appel Firestore qui peut throw
- **`onSnapshot`** : **toujours** retourner l'unsubscribe dans le cleanup du `useEffect`

## State management

- **`useState`** pour state local
- **`useReducer`** si state complexe avec plusieurs actions
- **Hook Firestore** pour la donnée serveur (jamais en `useState` synchronisé manuellement)
- **`useContext`** uniquement pour l'auth utilisateur / thème — pas pour la donnée serveur
- Pas de Redux / Zustand pour l'instant (overkill solo dev)

## Tailwind

- Classes inline OK, mais si une combinaison se répète **3+ fois** → extraire en composant ou helper `cn()`
- Palette : utiliser `tailwind.config.js` (pas de couleurs hex en dur dans le JSX)
- Mobile-first : breakpoints `md:` (tablette) prioritaires (cuisine = tablette principalement)
- Pas de `style={{ ... }}` inline sauf valeurs dynamiques (hauteurs calculées, etc.)

## Erreurs

- Toute opération async qui peut échouer → afficher un message lisible (pas une stack trace)
- JB n'est pas dev → messages en français, pas de jargon technique
- ErrorBoundary global déjà actif (`src/components/ErrorBoundary.tsx`) → attrape les crashs React
- Sentry actif (`src/lib/sentry.ts`) → remonte les erreurs prod automatiquement

## ESLint / Prettier

- ESLint flat config (`eslint.config.js`)
- Prettier formaté automatiquement par lint-staged au commit
- **Pas de `console.log`** en prod (utiliser `console.error` pour vraies erreurs, ou Sentry)
- Si besoin de logger un debug local : `eslint-disable-next-line no-console`

## Pas de bibliothèques sans raison

- Avant d'ajouter une dep → vérifier si :
  1. Le besoin est réel (pas juste "ce serait cool")
  2. La taille est acceptable (regarder bundlephobia)
  3. Une solution maison de 20 lignes ferait l'affaire
- Solo dev = chaque dep ajoutée = dette à maintenir
