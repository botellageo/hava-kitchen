import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/hooks/useAuth';
import { AppLogo } from '@/components/ui/AppLogo';
import { translateAuthError } from '@/lib/firebaseAuthErrors';

type LocationState = { from?: { pathname?: string } } | null;

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    const state = location.state as LocationState;
    const target = state?.from?.pathname ?? '/admin';
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(translateAuthError(err.code));
      } else {
        setError('Connexion impossible. Réessaie.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface shadow-card w-full max-w-md rounded-2xl p-8 md:p-12">
        <div className="mb-8">
          <AppLogo />
        </div>

        <h1 className="text-brand-darker mb-1 text-xl font-bold">Connexion</h1>
        <p className="mb-6 text-sm text-gray-500">
          Accès gérant. Les cuisiniers se connectent avec leur PIN sur la tablette.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2 focus:-outline-offset-1"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2 focus:-outline-offset-1"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-brand-darker font-semibold hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
