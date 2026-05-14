import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useProductTemplates } from '@/hooks/useProductTemplates';
import { useEtiquettes } from '@/hooks/useEtiquettes';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';
import { Combobox } from '@/components/ui/Combobox';
import { EtiquettePreview } from '@/components/cuisine/EtiquettePreview';
import { ProductListModal } from '@/components/cuisine/ProductListModal';
import { calculateDlc, generateEtiquettePdf } from '@/lib/generateEtiquettePdf';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function findMatch(templates: { id: string; nom: string; dlcDays: number }[], name: string) {
  const clean = name.trim().toLowerCase();
  if (!clean) return null;
  return templates.find((t) => t.nom.trim().toLowerCase() === clean) ?? null;
}

export default function EtiquettesPage() {
  const { restaurant, restaurantId, loading: restaurantLoading } = useRestaurant();
  const {
    templates,
    loading: templatesLoading,
    addTemplate,
    updateTemplate,
  } = useProductTemplates(restaurantId);
  const { createEtiquette } = useEtiquettes(restaurantId);
  const { cuisinier } = useCuisinierSession();
  const { showToast } = useToast();

  const [productName, setProductName] = useState('');
  const [dlcDays, setDlcDays] = useState<number>(3);
  const [prodDate, setProdDate] = useState<string>(todayIso());
  const [lot, setLot] = useState('');
  const [qte, setQte] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const matchedTemplate = useMemo(
    () => findMatch(templates, productName),
    [templates, productName],
  );

  // Quand on sélectionne / tape un nom qui match un template existant,
  // on auto-charge ses DLC jours. Si l'utilisateur a déjà modifié dlcDays
  // manuellement, on respecte sa valeur (mémorisé via dlcDaysTouched).
  // Pattern de sync state local avec donnée Firestore live, justifié.
  /* eslint-disable react-hooks/set-state-in-effect */
  const [dlcDaysTouched, setDlcDaysTouched] = useState(false);
  useEffect(() => {
    if (matchedTemplate && !dlcDaysTouched) {
      setDlcDays(matchedTemplate.dlcDays);
    }
  }, [matchedTemplate, dlcDaysTouched]);

  // Reset dlcDaysTouched quand le nom de produit change (nouveau contexte).
  useEffect(() => {
    setDlcDaysTouched(false);
  }, [productName]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const dlc = useMemo(() => {
    if (!productName.trim() || !prodDate) return '';
    return calculateDlc(prodDate, dlcDays);
  }, [productName, prodDate, dlcDays]);

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
    const cleanName = productName.trim();
    if (!cleanName) {
      showToast({ kind: 'error', message: 'Nom de produit requis.' });
      return;
    }
    if (!Number.isInteger(dlcDays) || dlcDays < 0 || dlcDays > 365) {
      showToast({ kind: 'error', message: 'DLC : entier entre 0 et 365 jours.' });
      return;
    }
    if (!Number.isInteger(qte) || qte < 1 || qte > 50) {
      showToast({ kind: 'error', message: 'Quantité entre 1 et 50.' });
      return;
    }
    setSubmitting(true);
    try {
      // Réconcilie la liste de templates :
      // - si pas de match exact → on crée un nouveau template
      // - si match mais DLC différente → on update les DLC du template
      const match = findMatch(templates, cleanName);
      if (!match) {
        await addTemplate({ nom: cleanName, dlcDays });
        showToast({
          kind: 'info',
          message: `Produit "${cleanName}" ajouté à la liste.`,
        });
      } else if (match.dlcDays !== dlcDays) {
        await updateTemplate(match.id, { dlcDays });
        showToast({
          kind: 'info',
          message: `DLC de "${cleanName}" mise à jour à ${dlcDays} j.`,
        });
      }

      // Crée l'étiquette (HACCP immutable)
      await createEtiquette({
        produit: cleanName,
        prodDate,
        dlc,
        ...(lot.trim() ? { lot: lot.trim() } : {}),
        qte,
        createdBy: cuisinier!.id,
      });

      // Génère le PDF
      generateEtiquettePdf({
        produit: cleanName,
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

      // Reset complet pour préparer la prochaine étiquette
      setProductName('');
      setDlcDays(3);
      setDlcDaysTouched(false);
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
          <div className="text-sm text-gray-500">Chargement…</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="product-input"
                  className="mb-1 block text-sm font-semibold text-gray-700"
                >
                  Produit
                </label>
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <Combobox
                      id="product-input"
                      value={productName}
                      onChange={setProductName}
                      options={templates.map((t) => ({
                        id: t.id,
                        label: t.nom,
                        hint: `DLC + ${t.dlcDays} j`,
                      }))}
                      placeholder="Tape ou sélectionne…"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setListOpen(true)}
                    title="Voir tous les produits"
                    aria-label="Voir tous les produits"
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-base transition hover:bg-gray-50"
                  >
                    📋
                  </button>
                </div>
                {productName.trim() && (
                  <p className="mt-1 text-xs">
                    {matchedTemplate ? (
                      <span className="text-brand-darker">✓ Produit existant</span>
                    ) : (
                      <span className="text-info-darker">
                        + Sera ajouté à la liste à la 1<sup>ère</sup> impression
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="dlc-days"
                    className="mb-1 block text-sm font-semibold text-gray-700"
                  >
                    DLC (jours)
                  </label>
                  <input
                    id="dlc-days"
                    type="number"
                    required
                    min={0}
                    max={365}
                    step={1}
                    value={dlcDays}
                    onChange={(e) => {
                      setDlcDays(Number(e.target.value));
                      setDlcDaysTouched(true);
                    }}
                    className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                  />
                  {matchedTemplate && matchedTemplate.dlcDays !== dlcDays && (
                    <p className="text-info-darker mt-1 text-xs">
                      ⓘ DLC du produit sera mise à jour à {dlcDays} j.
                    </p>
                  )}
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Lot <span className="font-normal text-gray-400">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={lot}
                    onChange={(e) => setLot(e.target.value)}
                    placeholder="L-260514-N"
                    className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !productName.trim()}
                className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Génération…' : '🖨️ Générer le PDF'}
              </button>

              <p className="text-center text-xs text-gray-400">
                Imprimante Brother QL-820NWB pas encore connectée — PDF téléchargeable en attendant.
              </p>
            </form>

            <ProductListModal
              open={listOpen}
              onClose={() => setListOpen(false)}
              templates={templates}
              onUpdateDlc={(pid, days) => updateTemplate(pid, { dlcDays: days })}
              onSelect={(t) => {
                setProductName(t.nom);
                setDlcDays(t.dlcDays);
                setDlcDaysTouched(false);
              }}
            />

            <div>
              <div className="mb-2 text-sm font-semibold text-gray-700">Aperçu (taille réelle)</div>
              <EtiquettePreview
                produit={productName || '—'}
                prodDate={prodDate}
                dlc={dlc}
                lot={lot}
                operateur={cuisinier.prenom}
              />
              <div className="bg-brand-softer text-brand-darker mt-3 rounded-lg p-3 text-xs">
                ℹ️ DLC = date de production + jours configurés. Tape un nouveau produit pour
                l'ajouter à la liste, ou modifie les DLC d'un produit existant.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
