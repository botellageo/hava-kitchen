import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { httpsCallable, type FunctionsError } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useReceptions } from '@/hooks/useReceptions';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';
import { ReceptionPhotoUploader } from '@/components/cuisine/ReceptionPhotoUploader';

interface OcrResult {
  produit: string;
  fournisseur: string | null;
  lot: string | null;
  qte: string | null;
  dlc: string | null;
}

interface UploadedPhoto {
  photoUrl: string;
  storagePath: string;
}

export default function ReceptionPage() {
  const { restaurant, restaurantId, loading: restaurantLoading } = useRestaurant();
  const { cuisinier } = useCuisinierSession();
  const { generateReceptionId, createReception } = useReceptions(restaurantId);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ID stable pour cette session de saisie (path Storage + doc Firestore identique).
  const receptionId = useMemo(
    () => (restaurantId ? generateReceptionId() : ''),
    [restaurantId, generateReceptionId],
  );

  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [produit, setProduit] = useState('');
  const [fournisseur, setFournisseur] = useState('');
  const [lot, setLot] = useState('');
  const [qte, setQte] = useState('');
  const [dlc, setDlc] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!cuisinier) {
    return <Navigate to="/cuisine" replace />;
  }
  // Attendre le 1er load du hook (chaque useRestaurant() instance redémarre son load au mount)
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

  async function runOcr(uploaded: UploadedPhoto) {
    setOcrLoading(true);
    setOcrError(null);
    try {
      const ocr = httpsCallable<{ restaurantId: string; storagePath: string }, OcrResult>(
        functions,
        'ocrReception',
      );
      const result = await ocr({
        restaurantId: restaurantId!,
        storagePath: uploaded.storagePath,
      });
      const data = result.data;
      setProduit(data.produit);
      if (data.fournisseur) setFournisseur(data.fournisseur);
      if (data.lot) setLot(data.lot);
      if (data.qte) setQte(data.qte);
      if (data.dlc) setDlc(data.dlc);
    } catch (err) {
      const fnErr = err as FunctionsError;
      setOcrError(fnErr.message ?? "L'IA n'a pas pu lire l'étiquette. Remplis manuellement.");
    } finally {
      setOcrLoading(false);
    }
  }

  function handlePhotoUploaded(uploaded: UploadedPhoto) {
    setPhoto(uploaded);
    void runOcr(uploaded);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!photo) return;
    if (!produit.trim()) {
      showToast({ kind: 'error', message: 'Produit requis.' });
      return;
    }
    setSubmitting(true);
    try {
      await createReception(receptionId, {
        produit,
        fournisseur,
        lot,
        qte,
        dlc,
        notes,
        photoUrl: photo.photoUrl,
        createdBy: cuisinier!.id,
      });
      showToast({ kind: 'success', message: 'Réception enregistrée.' });
      navigate('/cuisine/home', { replace: true });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Enregistrement impossible.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />
          <Link
            to="/cuisine/home"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <p className="text-sm text-gray-500">Module</p>
        <h1 className="text-brand-darker mt-1 mb-6 text-2xl font-bold md:text-3xl">
          📦 Nouvelle réception
        </h1>

        {!photo ? (
          <>
            <ReceptionPhotoUploader
              restaurantId={restaurantId}
              receptionId={receptionId}
              onUploaded={handlePhotoUploaded}
            />
            <div className="bg-brand-softer text-brand-darker mt-4 rounded-lg p-4 text-sm">
              <strong>✨ Auto-remplissage par IA</strong>
              <br />
              Une photo suffit. L'IA lit l'étiquette et remplit le formulaire ci-dessous. Tu n'as
              qu'à vérifier et valider.
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="bg-surface rounded-card border-brand overflow-hidden border-2">
              <img src={photo.photoUrl} alt="Étiquette" className="h-40 w-full object-cover" />
              {ocrLoading ? (
                <div className="bg-info-soft text-info-darker flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Analyse de l'étiquette par IA…
                </div>
              ) : ocrError ? (
                <div className="bg-alert-soft text-alert-darker px-4 py-2 text-sm">{ocrError}</div>
              ) : (
                <div className="bg-brand-softer text-brand-darker px-4 py-2 text-sm font-semibold">
                  ✓ Étiquette analysée
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Produit</label>
              <input
                type="text"
                required
                value={produit}
                onChange={(e) => setProduit(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Fournisseur</label>
              <input
                type="text"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">N° de lot</label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Quantité</label>
                <input
                  type="text"
                  value={qte}
                  onChange={(e) => setQte(e.target.value)}
                  className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                DLC fournisseur
              </label>
              <input
                type="date"
                value={dlc}
                onChange={(e) => setDlc(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Notes <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Aspect, température camion, etc."
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-2"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || ocrLoading || !produit.trim()}
              className="bg-brand hover:bg-brand-dark w-full rounded-xl px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : '💾 Enregistrer la réception'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
