import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ProductTemplateDoc } from '@/hooks/useProductTemplates';

interface FormValues {
  nom: string;
  dlcDays: number;
}

interface ProductTemplateFormModalProps {
  initial: ProductTemplateDoc | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}

export function ProductTemplateFormModal({
  initial,
  onClose,
  onSubmit,
}: ProductTemplateFormModalProps) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [dlcDays, setDlcDays] = useState<number>(initial?.dlcDays ?? 3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!nom.trim()) {
      setError('Nom du produit requis.');
      return;
    }
    if (!Number.isInteger(dlcDays) || dlcDays < 0 || dlcDays > 365) {
      setError('Le nombre de jours DLC doit être un entier entre 0 et 365.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ nom: nom.trim(), dlcDays });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open>
      <div className="p-6">
        <h2 className="text-brand-darker mb-4 text-lg font-bold">
          {initial ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Nom du produit</label>
            <input
              type="text"
              required
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Tartare de saumon"
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              DLC (jours après production)
            </label>
            <input
              type="number"
              required
              min={0}
              max={365}
              step={1}
              value={dlcDays}
              onChange={(e) => setDlcDays(Number(e.target.value))}
              className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ex : 3 = DLC = date de production + 3 jours.
            </p>
          </div>

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
