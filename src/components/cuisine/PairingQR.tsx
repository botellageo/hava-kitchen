import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { httpsCallable, type FunctionsError } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { PairingQRModal } from './PairingQRModal';

interface PairingQRProps {
  restaurantId: string;
  cuisinierId: string;
}

interface CreatePairingTokenResult {
  tokenId: string;
  expiresAt: number;
}

const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000; // refresh 1min avant expiration
const TOKEN_TTL_MS = 5 * 60 * 1000;

export function PairingQR({ restaurantId, cuisinierId }: PairingQRProps) {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const createToken = httpsCallable<
      { restaurantId: string; cuisinierId: string },
      CreatePairingTokenResult
    >(functions, 'createPairingToken');

    async function refresh() {
      try {
        const result = await createToken({ restaurantId, cuisinierId });
        if (cancelled) return;
        setTokenId(result.data.tokenId);
        setError(null);
        const ttl = Math.max(
          TOKEN_TTL_MS - REFRESH_BEFORE_EXPIRY_MS,
          result.data.expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS,
        );
        timerRef.current = setTimeout(() => {
          void refresh();
        }, ttl);
      } catch (err) {
        if (cancelled) return;
        const fnErr = err as FunctionsError;
        setError(fnErr.message ?? 'QR indisponible');
        // Retry après 30s en cas d'erreur
        timerRef.current = setTimeout(() => {
          void refresh();
        }, 30 * 1000);
      }
    }

    void refresh();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [restaurantId, cuisinierId]);

  if (error) {
    return (
      <span
        title={error}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-[10px] text-red-600"
      >
        !
      </span>
    );
  }

  if (!tokenId) {
    return (
      <span
        aria-label="Génération QR…"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-[10px] text-gray-400"
      >
        …
      </span>
    );
  }

  const pairingUrl = `${window.location.origin}/pair?rid=${encodeURIComponent(restaurantId)}&token=${encodeURIComponent(tokenId)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Scanner avec ton téléphone pour s'y connecter"
        aria-label="Ouvrir le QR de pairing"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white p-0.5 transition hover:border-brand"
      >
        <QRCodeSVG value={pairingUrl} size={24} level="M" />
      </button>

      {open && <PairingQRModal url={pairingUrl} onClose={() => setOpen(false)} />}
    </>
  );
}
