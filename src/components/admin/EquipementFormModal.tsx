import { useState, type FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { EquipementDoc } from '@/hooks/useEquipements';
import type { EquipementInput } from '@/lib/equipements';

/** Seuils par défaut proposés selon le type (modifiables par le gérant). */
const DEFAULT_SEUILS: Record<EquipementInput['type'], { min: number; max: number }> = {
  frigo: { min: 0, max: 6 },
  congelateur: { min: -22, max: -18 },
  autre: { min: 0, max: 10 },
};

interface EquipementFormModalProps {
  initial: EquipementDoc | null;
  onClose: () => void;
  onSubmit: (values: EquipementInput) => Promise<void>;
}

export function EquipementFormModal({ initial, onClose, onSubmit }: EquipementFormModalProps) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [type, setType] = useState<EquipementInput['type']>(initial?.type ?? 'frigo');
  const [seuilMin, setSeuilMin] = useState<number>(initial?.seuilMin ?? DEFAULT_SEUILS.frigo.min);
  const [seuilMax, setSeuilMax] = useState<number>(initial?.seuilMax ?? DEFAULT_SEUILS.frigo.max);
  const [sondeId, setSondeId] = useState(initial?.sondeId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(next: EquipementInput['type']) {
    setType(next);
    // Nouvel équipement : proposer les seuils standards du type choisi
    if (!initial) {
      setSeuilMin(DEFAULT_SEUILS[next].min);
      setSeuilMax(DEFAULT_SEUILS[next].max);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!nom.trim()) {
      setError("Nom de l'équipement requis.");
      return;
    }
    if (Number.isNaN(seuilMin) || Number.isNaN(seuilMax) || seuilMin >= seuilMax) {
      setError('Le seuil min doit être inférieur au seuil max.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        nom: nom.trim(),
        type,
        seuilMin,
        seuilMax,
        ...(sondeId.trim() ? { sondeId: sondeId.trim() } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2';

  return (
    <Modal open>
      <div className="p-6">
        <h2 className="text-brand-darker mb-4 text-lg font-bold">
          {initial ? "Modifier l'équipement" : 'Ajouter un équipement'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Nom</label>
            <input
              type="text"
              required
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Frigo positif 1"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as EquipementInput['type'])}
              className={inputClass}
            >
              <option value="frigo">Frigo positif</option>
              <option value="congelateur">Congélateur</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Seuil min (°C)
              </label>
              <input
                type="number"
                required
                step={0.5}
                value={seuilMin}
                onChange={(e) => setSeuilMin(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Seuil max (°C)
              </label>
              <input
                type="number"
                required
                step={0.5}
                value={seuilMax}
                onChange={(e) => setSeuilMax(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Identifiant sonde (optionnel)
            </label>
            <input
              type="text"
              value={sondeId}
              onChange={(e) => setSondeId(e.target.value)}
              placeholder="0xA1B2"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              À renseigner quand les sondes seront installées.
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
