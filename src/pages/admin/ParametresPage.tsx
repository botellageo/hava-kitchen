import { useState, type FormEvent } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { isValidPinFormat } from '@/lib/pin';
import { PinInput } from '@/components/ui/PinInput';

export default function ParametresPage() {
  const { restaurant, verifyManagerPin, updateManagerPin } = useRestaurant();
  const { showToast } = useToast();
  const [editingPin, setEditingPin] = useState(false);

  return (
    <div>
      <h1 className="text-brand-darker mb-6 text-2xl font-bold md:text-3xl">Paramètres</h1>

      <div className="bg-surface rounded-card mb-4 border border-gray-200 p-5">
        <h2 className="text-brand-darker mb-1 text-base font-bold">Restaurant</h2>
        <p className="text-sm text-gray-500">Nom : {restaurant?.nom ?? '—'}</p>
        {restaurant?.adresse && (
          <p className="mt-0.5 text-sm text-gray-500">Adresse : {restaurant.adresse}</p>
        )}
      </div>

      <div className="bg-surface rounded-card border border-gray-200 p-5">
        <h2 className="text-brand-darker mb-1 text-base font-bold">PIN gérant</h2>
        <p className="mb-3 text-sm text-gray-500">
          Sert à débloquer la création d'un cuisinier depuis l'écran cuisine sans repasser par
          l'admin.
        </p>
        <button
          type="button"
          onClick={() => setEditingPin(true)}
          className="bg-brand hover:bg-brand-dark rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
        >
          Modifier le PIN gérant
        </button>
      </div>

      {editingPin && (
        <ChangeManagerPinModal
          onClose={() => setEditingPin(false)}
          onSubmit={async ({ oldPin, newPin }) => {
            const ok = await verifyManagerPin(oldPin);
            if (!ok) {
              throw new Error('Ancien PIN incorrect.');
            }
            await updateManagerPin(newPin);
            showToast({ kind: 'success', message: 'PIN gérant mis à jour.' });
            setEditingPin(false);
          }}
        />
      )}
    </div>
  );
}

function ChangeManagerPinModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (values: { oldPin: string; newPin: string }) => Promise<void>;
}) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!isValidPinFormat(oldPin)) {
      setError('Ancien PIN : 4 à 6 chiffres requis.');
      return;
    }
    if (!isValidPinFormat(newPin)) {
      setError('Nouveau PIN : 4 à 6 chiffres requis.');
      return;
    }
    if (newPin !== newPinConfirm) {
      setError('Les deux nouveaux PIN ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ oldPin, newPin });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="shadow-modal w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-brand-darker mb-4 text-lg font-bold">Modifier le PIN gérant</h2>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <PinInput label="Ancien PIN" value={oldPin} onChange={setOldPin} autoFocus />
          <PinInput label="Nouveau PIN" value={newPin} onChange={setNewPin} />
          <PinInput
            label="Confirme le nouveau PIN"
            value={newPinConfirm}
            onChange={setNewPinConfirm}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand-dark rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
