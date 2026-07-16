import imageCompression from 'browser-image-compression';

/**
 * Compresse une photo prise par l'utilisateur avant upload Firebase Storage.
 * - Max dimension : 1920px (qualité OCR Claude OK à cette résolution)
 * - JPEG quality : 0.8
 * - Réduit typiquement 5MB → 300-500kb
 *
 * Si la lib échoue (cas exotique), retourne le file original.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: 'image/jpeg',
    });
    return compressed;
  } catch {
    return file;
  }
}
