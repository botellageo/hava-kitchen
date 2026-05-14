import { useState, type FormEvent } from 'react';
import { isValidPinFormat } from '@/lib/pin';
import { PinInput } from '@/components/ui/PinInput';

interface SetupStepPinProps {
  onBack: () => void;
  onSubmit: (pin: string) => Promise<void>;
}

export function SetupStepPin({ onBack, onSubmit }: SetupStepPinProps) {
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
      await onSubmit(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <h1 className="text-brand-darker text-xl font-bold">Choisis un PIN gérant</h1>
      <p className="text-sm text-gray-500">
        Ce PIN à 4-6 chiffres te permettra de débloquer l'ajout d'un cuisinier depuis la cuisine
        sans repasser par l'admin. Note-le bien, il est différent de ton mot de passe.
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
          onClick={onBack}
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
  );
}
