import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { httpsCallable, type FunctionsError } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useReceptions } from '@/hooks/useReceptions';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';
import { ReceptionPhotoCard } from '@/components/cuisine/ReceptionPhotoCard';
import { ReceptionForm, type ReceptionFormValues } from '@/components/cuisine/ReceptionForm';
import type { UploadedPhoto } from '@/components/cuisine/ReceptionPhotoUploader';

interface OcrResult {
  produit: string;
  fournisseur: string | null;
  lot: string | null;
  qte: string | null;
  dlc: string | null;
}

const EMPTY_VALUES: ReceptionFormValues = {
  produit: '',
  fournisseur: '',
  lot: '',
  qte: '',
  dlc: '',
  notes: '',
};

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
  const [ocrDone, setOcrDone] = useState(false);
  const [values, setValues] = useState<ReceptionFormValues>(EMPTY_VALUES);
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

  function setField(field: keyof ReceptionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
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
      setValues((prev) => ({
        ...prev,
        produit: data.produit,
        fournisseur: data.fournisseur ?? prev.fournisseur,
        lot: data.lot ?? prev.lot,
        qte: data.qte ?? prev.qte,
        dlc: data.dlc ?? prev.dlc,
      }));
      setOcrDone(true);
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
    if (!values.produit.trim()) {
      showToast({ kind: 'error', message: 'Produit requis.' });
      return;
    }
    setSubmitting(true);
    try {
      await createReception(receptionId, {
        ...values,
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />
          <Link
            to="/cuisine/home"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <p className="text-sm text-gray-500">Module</p>
        <h1 className="text-brand-darker mt-1 mb-6 text-2xl font-bold md:text-3xl">
          📦 Nouvelle réception
        </h1>

        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <ReceptionPhotoCard
            restaurantId={restaurantId}
            receptionId={receptionId}
            photo={photo}
            ocrLoading={ocrLoading}
            ocrError={ocrError}
            onUploaded={handlePhotoUploaded}
          />
          <ReceptionForm
            values={values}
            onChange={setField}
            onSubmit={handleSubmit}
            submitting={submitting}
            ocrLoading={ocrLoading}
            hasPhoto={photo !== null}
            ocrDone={ocrDone}
          />
        </div>
      </main>
    </div>
  );
}
