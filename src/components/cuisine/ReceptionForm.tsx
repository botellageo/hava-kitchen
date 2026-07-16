import type { FormEvent } from 'react';

export interface ReceptionFormValues {
  produit: string;
  fournisseur: string;
  lot: string;
  qte: string;
  dlc: string;
  notes: string;
}

interface ReceptionFormProps {
  values: ReceptionFormValues;
  onChange: (field: keyof ReceptionFormValues, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  ocrLoading: boolean;
  hasPhoto: boolean;
  /** true quand l'OCR a rempli les champs avec succès (badge « Pré-rempli par IA »). */
  ocrDone: boolean;
}

const inputClass =
  'focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2';
const labelClass = 'mb-1 block text-sm font-semibold text-gray-700';

/**
 * Colonne droite de la page Réception (façon maquette PMS_04) :
 * formulaire « Informations livraison », visible en permanence.
 * La photo reste obligatoire (preuve DDPP) — submit désactivé sans elle.
 */
export function ReceptionForm({
  values,
  onChange,
  onSubmit,
  submitting,
  ocrLoading,
  hasPhoto,
  ocrDone,
}: ReceptionFormProps) {
  const canSubmit = hasPhoto && !submitting && !ocrLoading && values.produit.trim() !== '';

  return (
    <section className="bg-surface rounded-card border border-gray-200 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-gray-900">Informations livraison</h3>
        {ocrDone && (
          <span className="bg-brand-softer text-brand-darker rounded-full px-2.5 py-1 text-xs font-semibold">
            ✨ Pré-rempli par IA
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className={labelClass}>Produit</label>
          <input
            type="text"
            required
            value={values.produit}
            onChange={(e) => onChange('produit', e.target.value)}
            placeholder="ex : Entrecôtes parées 250 g"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Fournisseur</label>
          <input
            type="text"
            value={values.fournisseur}
            onChange={(e) => onChange('fournisseur', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>N° de lot</label>
            <input
              type="text"
              value={values.lot}
              onChange={(e) => onChange('lot', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Quantité</label>
            <input
              type="text"
              value={values.qte}
              onChange={(e) => onChange('qte', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>DLC fournisseur</label>
          <input
            type="date"
            value={values.dlc}
            onChange={(e) => onChange('dlc', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Notes <span className="font-normal text-gray-400">(optionnel)</span>
          </label>
          <textarea
            value={values.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={2}
            placeholder="Aspect, température camion, etc."
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : '💾 Enregistrer la réception'}
        </button>

        {!hasPhoto && (
          <p className="text-center text-xs text-gray-400">
            📷 Prends d'abord la photo de l'étiquette — c'est la preuve conservée pour la DDPP.
          </p>
        )}
      </form>
    </section>
  );
}
