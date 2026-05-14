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
 * Modal plein écran avec grille de chips produits.
 * - Tap sur un chip : sélection + close modal + autofill du form parent
 * - Champ DLC inline modifiable (update au blur, ne déclenche pas la sélection)
 */
export function ProductListModal({
  open,
  onClose,
  templates,
  onUpdateDlc,
  onSelect,
}: ProductListModalProps) {
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function commitEdit(t: ProductTemplateDoc) {
    const next = edits[t.id];
    if (next === undefined || next === t.dlcDays) return;
    if (!Number.isInteger(next) || next < 0 || next > 365) {
      setError(`${t.nom} : DLC doit être un entier entre 0 et 365 jours.`);
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
    <Modal open={open} onClose={onClose} size="full">
      <header className="bg-surface flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 md:px-6">
        <h2 className="text-brand-darker text-xl font-bold">Choisis un produit</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
        >
          ✕ Fermer
        </button>
      </header>

      <main className="bg-surface-softer flex-1 overflow-auto px-4 py-6 md:px-6 md:py-8">
        <p className="mb-4 text-sm text-gray-500">
          Tap sur un produit pour l'utiliser. Modifie le nombre de jours DLC directement dans la
          case.
        </p>

        {templates.length === 0 ? (
          <div className="rounded-card border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">Aucun produit.</p>
            <p className="mt-1 text-sm text-gray-400">
              Ferme cette fenêtre et tape le nom dans le champ pour créer un produit.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {templates.map((t) => {
              const currentValue = edits[t.id] ?? t.dlcDays;
              const isSaving = savingId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelect(t);
                    onClose();
                  }}
                  className="bg-surface hover:bg-brand-soft hover:border-brand group flex min-h-[140px] flex-col items-stretch gap-3 rounded-card border-2 border-gray-200 p-4 text-left transition active:scale-95"
                >
                  <div className="flex-1">
                    <div className="text-base leading-tight font-bold text-gray-900">{t.nom}</div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <label className="text-xs font-semibold text-gray-500">DLC</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      step={1}
                      value={currentValue}
                      disabled={isSaving}
                      onChange={(e) => setEdits((p) => ({ ...p, [t.id]: Number(e.target.value) }))}
                      onBlur={() => void commitEdit(t)}
                      onClick={(e) => e.stopPropagation()}
                      className="focus:outline-brand w-14 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-sm focus:outline-2"
                    />
                    <span className="text-xs text-gray-500">jours</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </main>
    </Modal>
  );
}
