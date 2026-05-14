import { useState, type FormEvent } from 'react';
import { isValidPinFormat } from '@/lib/pin';

interface QuickAddCuisinierModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    prenom: string;
    nom: string;
    pin: string;
  }) => Promise<{ ok: true } | { ok: false; message?: string }>;
}

export function QuickAddCuisinierModal({ open, onCancel, onSubmit }: QuickAddCuisinierModalProps) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function resetAndClose() {
    setPrenom('');
    setNom('');
    setPin('');
    setPinConfirm('');
    setError(null);
    onCancel();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!prenom.trim() || !nom.trim()) {
      setError('Prénom et nom requis.');
      return;
    }
    if (!isValidPinFormat(pin)) {
      setError('Le PIN doit faire 4 à 6 chiffres.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('Les deux PIN ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSubmit({
        prenom: prenom.trim(),
        nom: nom.trim(),
        pin,
      });
      if (result.ok) {
        setPrenom('');
        setNom('');
        setPin('');
        setPinConfirm('');
      } else {
        setError(result.message ?? 'Création impossible.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="shadow-modal w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-brand-darker mb-1 text-lg font-bold">Nouveau cuisinier</h2>
        <p className="mb-4 text-sm text-gray-500">Ajout rapide. Tu pourras modifier plus tard.</p>

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

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              PIN (4 à 6 chiffres)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl tracking-[0.4em] focus:outline-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Confirme le PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              required
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl tracking-[0.4em] focus:outline-2"
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

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetAndClose}
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
              {submitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
