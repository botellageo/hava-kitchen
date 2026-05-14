import { useState, type FormEvent } from 'react';
import { isValidPinFormat } from '@/lib/pin';
import { PinInput } from '@/components/ui/PinInput';
import { Modal } from '@/components/ui/Modal';
import type { CuisinierDoc } from '@/hooks/useCuisiniers';

export interface CuisinierFormValues {
  prenom: string;
  nom: string;
  /** Vide = ne pas changer le PIN (mode édition sans toggle "changer PIN"). */
  pin: string;
}

interface CuisinierFormModalProps {
  initial: CuisinierDoc | null;
  onClose: () => void;
  onSubmit: (values: CuisinierFormValues) => Promise<void>;
}

export function CuisinierFormModal({ initial, onClose, onSubmit }: CuisinierFormModalProps) {
  const [prenom, setPrenom] = useState(initial?.prenom ?? '');
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [changePin, setChangePin] = useState(initial === null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!prenom.trim() || !nom.trim()) {
      setError('Prénom et nom sont requis.');
      return;
    }
    const pinNeeded = changePin || initial === null;
    if (pinNeeded) {
      if (!isValidPinFormat(pin)) {
        setError('Le PIN doit faire 4 à 6 chiffres.');
        return;
      }
      if (pin !== pinConfirm) {
        setError('Les deux PIN ne correspondent pas.');
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit({
        prenom: prenom.trim(),
        nom: nom.trim(),
        pin: pinNeeded ? pin : '',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open>
      <div className="p-6">
        <h2 className="text-brand-darker mb-4 text-lg font-bold">
          {initial ? 'Modifier le cuisinier' : 'Ajouter un cuisinier'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Prénom</label>
              <input
                type="text"
                required
                autoFocus
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
              />
            </div>
          </div>

          {initial && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={changePin}
                onChange={(e) => setChangePin(e.target.checked)}
              />
              Changer le PIN
            </label>
          )}

          {(changePin || initial === null) && (
            <>
              <PinInput label="PIN (4 à 6 chiffres)" value={pin} onChange={setPin} />
              <PinInput label="Confirme le PIN" value={pinConfirm} onChange={setPinConfirm} />
            </>
          )}

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
    </Modal>
  );
}
