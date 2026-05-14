import { useState, type FormEvent } from 'react';

interface SetupStepAccountProps {
  initialEmail?: string;
  onNext: (values: { email: string; password: string }) => void;
}

export function SetupStepAccount({ initialEmail = '', onNext }: SetupStepAccountProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Email requis.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    onNext({ email: email.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h1 className="text-brand-darker text-xl font-bold">Crée ton compte gérant</h1>
      <p className="text-sm text-gray-500">
        Ton email et ton mot de passe servent à te connecter sur n'importe quel appareil.
      </p>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2 focus:-outline-offset-1"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">
          Mot de passe <span className="font-normal text-gray-400">(minimum 6 caractères)</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2 focus:-outline-offset-1"
        />
      </div>

      <div>
        <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-semibold text-gray-700">
          Confirme le mot de passe
        </label>
        <input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
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
        disabled={!email || !password || !passwordConfirm}
        className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Suivant
      </button>
    </form>
  );
}
