import { useRef, useState } from 'react';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { compressImage } from '@/lib/imageCompress';

interface UploadedPhoto {
  photoUrl: string;
  storagePath: string;
}

interface ReceptionPhotoUploaderProps {
  restaurantId: string;
  receptionId: string;
  onUploaded: (photo: UploadedPhoto) => void;
}

type Status = 'idle' | 'compressing' | 'uploading' | 'done' | 'error';

export function ReceptionPhotoUploader({
  restaurantId,
  receptionId,
  onUploaded,
}: ReceptionPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      setStatus('compressing');
      const compressed = await compressImage(file);
      setPreviewUrl(URL.createObjectURL(compressed));

      setStatus('uploading');
      setProgress(0);
      const path = `restaurants/${restaurantId}/receptions/${receptionId}/photo.jpg`;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, compressed, { contentType: 'image/jpeg' });

      task.on(
        'state_changed',
        (snap) => {
          setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (err) => {
          setStatus('error');
          setError(err.message);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setStatus('done');
          onUploaded({ photoUrl: url, storagePath: path });
        },
      );
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload impossible');
    }
  }

  if (status === 'done' && previewUrl) {
    return (
      <div className="bg-surface rounded-card border-brand overflow-hidden border-2">
        <img src={previewUrl} alt="Étiquette" className="h-48 w-full object-cover" />
        <div className="bg-brand-softer text-brand-darker px-4 py-2 text-center text-sm font-semibold">
          ✓ Photo envoyée
        </div>
      </div>
    );
  }

  if (status === 'uploading' || status === 'compressing') {
    return (
      <div className="bg-surface rounded-card border-2 border-gray-300 p-8 text-center">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Aperçu"
            className="mx-auto mb-4 h-32 rounded-lg object-cover"
          />
        )}
        <p className="text-sm text-gray-600">
          {status === 'compressing' ? 'Compression de la photo…' : `Envoi en cours… ${progress}%`}
        </p>
        {status === 'uploading' && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="bg-brand h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="bg-surface hover:bg-brand-softer flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-gray-300 p-8 transition hover:border-brand"
      >
        <div className="text-4xl">📷</div>
        <div className="text-brand-darker text-base font-semibold">Prendre la photo</div>
        <div className="text-xs text-gray-500">de l'étiquette du carton / colis</div>
      </button>
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
