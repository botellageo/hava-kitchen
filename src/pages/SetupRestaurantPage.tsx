import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { isValidPinFormat } from '@/lib/pin';
import { AppLogo } from '@/components/ui/AppLogo';
import { PinInput } from '@/components/ui/PinInput';

type Step = 'resto' | 'pin';

export default function SetupRestaurantPage() {
  const { user, signOut } = useAuth();
  const { restaurant, loading, createRestaurant } = useRestaurant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('resto');
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si un resto existe déjà pour ce user, le wizard n'a pas lieu d'être
  if (!loading && restaurant) {
    return <Navigate to="/admin" replace />;
  }

  function goToPinStep(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!nom.trim()) {
      setError('Le nom du restaurant est requis.');
      return;
    }
    setStep('pin');
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isValidPinFormat(pin)) {
      setError('Le PIN gérant doit faire 4 à 6 chiffres.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('Les deux PIN ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      await createRestaurant({
        nom: nom.trim(),
        ...(adresse.trim() ? { adresse: adresse.trim() } : {}),
        managerPin: pin,
      });
      showToast({ kind: 'success', message: 'Restaurant créé.' });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface shadow-card w-full max-w-lg rounded-2xl p-8 md:p-12">
        <div className="mb-2">
          <AppLogo />
        </div>

        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <span className={step === 'resto' ? 'text-brand-darker font-semibold' : ''}>
            1. Restaurant
          </span>
          <span>→</span>
          <span className={step === 'pin' ? 'text-brand-darker font-semibold' : ''}>
            2. PIN gérant
          </span>
        </div>

        {step === 'resto' && (
          <form onSubmit={goToPinStep} className="space-y-4" noValidate>
            <h1 className="text-brand-darker text-xl font-bold">Configure ton restaurant</h1>
            <p className="text-sm text-gray-500">
              Première connexion détectée. Quelques infos sur ton établissement.
              {user?.email && (
                <>
                  {' '}
                  Connecté en tant que <strong>{user.email}</strong>.
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
              onClick={() => void signOut()}
              className="block w-full text-center text-xs text-gray-400 hover:text-gray-600"
            >
              Se déconnecter
            </button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={handleCreate} className="space-y-4" noValidate>
            <h1 className="text-brand-darker text-xl font-bold">Choisis un PIN gérant</h1>
            <p className="text-sm text-gray-500">
              Ce PIN à 4-6 chiffres te permettra de débloquer l'ajout d'un cuisinier depuis la
              cuisine sans repasser par l'admin. Note-le bien, il est différent de ton mot de passe.
            </p>

            <PinInput
              id="pin"
              label="PIN gérant (4 à 6 chiffres)"
              value={pin}
              onChange={setPin}
              required
              autoFocus
            />

            <PinInput
              id="pinConfirm"
              label="Confirme le PIN"
              value={pinConfirm}
              onChange={setPinConfirm}
              required
            />

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('resto')}
                disabled={submitting}
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={submitting || !pin || !pinConfirm}
                className="bg-brand hover:bg-brand-dark flex-1 rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Création…' : 'Créer mon restaurant'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
