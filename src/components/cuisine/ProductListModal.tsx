import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ProductTemplateDoc } from '@/hooks/useProductTemplates';

interface ProductListModalProps {
  open: boolean;
  onClose: () => void;
  templates: ProductTemplateDoc[];
  /** Mise à jour DLC d'un template (au blur du champ). */
  onUpdateDlc: (pid: string, dlcDays: number) => Promise<void>;
  /** Sélection : autofill le formulaire avec ce produit. */
  onSelect: (template: ProductTemplateDoc) => void;
}

/**
 * Modal en table des templates produits. DLC modifiable inline (update au blur),
 * clic "Choisir" → ferme et autofill le formulaire parent.
 */
export function ProductListModal({
  open,
  onClose,
  templates,
  onUpdateDlc,
  onSelect,
}: ProductListModalProps) {
  // Edits locaux (avant blur). Map pid -> new dlcDays.
  const [edits, setEdits] = useState<Record<string, number>>({});
  // pid en cours de save
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function commitEdit(t: ProductTemplateDoc) {
    const next = edits[t.id];
    if (next === undefined || next === t.dlcDays) return;
    if (!Number.isInteger(next) || next < 0 || next > 365) {
      setError('DLC doit être un entier entre 0 et 365 jours.');
      setEdits((p) => {
        const rest = { ...p };
        delete rest[t.id];
        return rest;
      });
      return;
    }
    setSavingId(t.id);
    setError(null);
    try {
      await onUpdateDlc(t.id, next);
      setEdits((p) => {
        const rest = { ...p };
        delete rest[t.id];
        return rest;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-brand-darker text-lg font-bold">Mes produits</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Modifie les jours DLC à la volée. Clique "Choisir" pour utiliser un produit.
        </p>

        {templates.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Aucun produit. Tape un nom dans le champ pour en créer un.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {templates.map((t) => {
              const currentValue = edits[t.id] ?? t.dlcDays;
              const isSaving = savingId === t.id;
              return (
                <li key={t.id} className="flex items-center gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">{t.nom}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={currentValue}
                      disabled={isSaving}
                      onChange={(e) => setEdits((p) => ({ ...p, [t.id]: Number(e.target.value) }))}
                      onBlur={() => void commitEdit(t)}
                      className="focus:outline-brand w-14 rounded-md border border-gray-300 px-2 py-1 text-center text-sm focus:outline-2"
                    />
                    <span className="text-xs text-gray-500">j</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(t);
                      onClose();
                    }}
                    className="bg-brand hover:bg-brand-dark shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition"
                  >
                    Choisir
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
