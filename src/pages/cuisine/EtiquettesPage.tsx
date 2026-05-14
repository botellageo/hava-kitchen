import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useProductTemplates } from '@/hooks/useProductTemplates';
import { useEtiquettes } from '@/hooks/useEtiquettes';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';
import { EtiquettePreview } from '@/components/cuisine/EtiquettePreview';
import { calculateDlc, generateEtiquettePdf } from '@/lib/generateEtiquettePdf';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EtiquettesPage() {
  const { restaurant, restaurantId, loading: restaurantLoading } = useRestaurant();
  const { templates, loading: templatesLoading } = useProductTemplates(restaurantId);
  const { createEtiquette } = useEtiquettes(restaurantId);
  const { cuisinier } = useCuisinierSession();
  const { showToast } = useToast();

  const [templateId, setTemplateId] = useState<string>('');
  const [prodDate, setProdDate] = useState<string>(todayIso());
  const [lot, setLot] = useState('');
  const [qte, setQte] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const dlc = useMemo(() => {
    if (!selectedTemplate || !prodDate) return '';
    return calculateDlc(prodDate, selectedTemplate.dlcDays);
  }, [selectedTemplate, prodDate]);

  if (!cuisinier) {
    return <Navigate to="/cuisine" replace />;
  }
  if (restaurantLoading) {
    return (
      <div className="bg-surface-softer flex min-h-screen items-center justify-center">
        <div className="text-brand-darker text-sm">Chargement…</div>
      </div>
    );
  }
  if (!restaurantId) {
    return <Navigate to="/cuisine/home" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTemplate) {
      showToast({ kind: 'error', message: 'Choisis un produit.' });
      return;
    }
    if (!Number.isInteger(qte) || qte < 1 || qte > 50) {
      showToast({ kind: 'error', message: 'Quantité entre 1 et 50.' });
      return;
    }
    setSubmitting(true);
    try {
      await createEtiquette({
        produit: selectedTemplate.nom,
        prodDate,
        dlc,
        ...(lot.trim() ? { lot: lot.trim() } : {}),
        qte,
        createdBy: cuisinier!.id,
      });

      generateEtiquettePdf({
        produit: selectedTemplate.nom,
        prodDate,
        dlc,
        ...(lot.trim() ? { lot: lot.trim() } : {}),
        operateur: cuisinier!.prenom,
        qte,
      });

      showToast({
        kind: 'success',
        message: `${qte} étiquette${qte > 1 ? 's' : ''} générée${qte > 1 ? 's' : ''}.`,
      });

      // Reset partiel : on garde le produit + date pour permettre une nouvelle impression rapide.
      setLot('');
      setQte(1);
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Génération impossible.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />
          <Link
            to="/cuisine/home"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <p className="text-sm text-gray-500">Module</p>
        <h1 className="text-brand-darker mt-1 mb-6 text-2xl font-bold md:text-3xl">
          🏷️ Étiquettes DLC
        </h1>

        {templatesLoading ? (
          <div className="text-sm text-gray-500">Chargement des produits…</div>
        ) : templates.length === 0 ? (
          <div className="bg-surface rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">Pas encore de produit configuré.</p>
            <p className="mt-1 text-sm text-gray-400">
              Demande au gérant d'en ajouter depuis l'espace gestion (Admin → Produits).
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Produit</label>
                <select
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="focus:outline-brand w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:outline-2"
                >
                  <option value="">— Choisir —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nom} (DLC + {t.dlcDays} j)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Date production
                  </label>
                  <input
                    type="date"
                    required
                    value={prodDate}
                    onChange={(e) => setProdDate(e.target.value)}
                    className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Quantité</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    step={1}
                    value={qte}
                    onChange={(e) => setQte(Number(e.target.value))}
                    className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Lot / Référence <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  placeholder="L-260514-N"
                  className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedTemplate}
                className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Génération…' : '🖨️ Générer le PDF'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Imprimante Brother QL-820NWB pas encore connectée — PDF téléchargeable en attendant.
              </p>
            </form>

            <div>
              <div className="mb-2 text-sm font-semibold text-gray-700">Aperçu (taille réelle)</div>
              <EtiquettePreview
                produit={selectedTemplate?.nom ?? ''}
                prodDate={prodDate}
                dlc={dlc}
                lot={lot}
                operateur={cuisinier.prenom}
              />
              <div className="bg-brand-softer text-brand-darker mt-3 rounded-lg p-3 text-xs">
                ℹ️ DLC calculée automatiquement selon la fiche produit (DLC + N jours).
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
