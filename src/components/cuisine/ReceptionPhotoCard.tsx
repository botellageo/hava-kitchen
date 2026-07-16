import {
  ReceptionPhotoUploader,
  type UploadedPhoto,
} from '@/components/cuisine/ReceptionPhotoUploader';

interface ReceptionPhotoCardProps {
  restaurantId: string;
  receptionId: string;
  photo: UploadedPhoto | null;
  ocrLoading: boolean;
  ocrError: string | null;
  onUploaded: (uploaded: UploadedPhoto) => void;
}

/**
 * Colonne gauche de la page Réception (façon maquette PMS_04) :
 * zone photo (ou aperçu + statut OCR) + encarts IA / téléphone perso.
 */
export function ReceptionPhotoCard({
  restaurantId,
  receptionId,
  photo,
  ocrLoading,
  ocrError,
  onUploaded,
}: ReceptionPhotoCardProps) {
  return (
    <section className="bg-surface rounded-card border border-gray-200 p-5">
      <h3 className="mb-3 text-base font-bold text-gray-900">Photo de l'étiquette fournisseur</h3>

      {!photo ? (
        <ReceptionPhotoUploader
          restaurantId={restaurantId}
          receptionId={receptionId}
          onUploaded={onUploaded}
        />
      ) : (
        <div className="border-brand rounded-card overflow-hidden border-2">
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
      )}

      <div className="bg-brand-softer text-brand-darker mt-4 rounded-lg p-4 text-sm">
        <strong>✨ Auto-remplissage par IA</strong>
        <br />
        Une photo suffit. L'IA lit l'étiquette et remplit le formulaire à droite. Tu n'as qu'à
        vérifier et valider.
      </div>

      <div className="bg-info-soft text-info-darker mt-3 rounded-lg p-4 text-sm">
        💡 En production, l'équipe peut aussi utiliser son téléphone perso — c'est plus pratique en
        chambre froide qu'avec la tablette.
      </div>
    </section>
  );
}
