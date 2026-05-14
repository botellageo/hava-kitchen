import { useState, type FormEvent } from 'react';

interface SetupStepRestoProps {
  initialNom?: string;
  initialAdresse?: string;
  userEmail?: string | null;
  onNext: (values: { nom: string; adresse: string }) => void;
  onSignOut: () => void;
}

export function SetupStepResto({
  initialNom = '',
  initialAdresse = '',
  userEmail,
  onNext,
  onSignOut,
}: SetupStepRestoProps) {
  const [nom, setNom] = useState(initialNom);
  const [adresse, setAdresse] = useState(initialAdresse);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Le nom du restaurant est requis.');
      return;
    }
    onNext({ nom: nom.trim(), adresse: adresse.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h1 className="text-brand-darker text-xl font-bold">Configure ton restaurant</h1>
      <p className="text-sm text-gray-500">
        Première connexion détectée. Quelques infos sur ton établissement.
        {userEmail && (
          <>
            {' '}
            Connecté en tant que <strong>{userEmail}</strong>.
          </>
        )}
      </p>

      <div>
        <label htmlFor="nom" className="mb-1 block text-sm font-semibold text-gray-700">
          Nom du restaurant
        </label>
        <input
          id="nom"
          type="text"
          required
          autoFocus
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Midi 5"
          className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2 focus:-outline-offset-1"
        />
      </div>

      <div>
        <label htmlFor="adresse" className="mb-1 block text-sm font-semibold text-gray-700">
          Adresse <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <input
          id="adresse"
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="10 rue de la Cuisine, 75001 Paris"
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
        disabled={!nom.trim()}
        className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        Suivant
      </button>

      <button
        type="button"
        onClick={onSignOut}
        className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
      >
        Se déconnecter
      </button>
    </form>
  );
}
