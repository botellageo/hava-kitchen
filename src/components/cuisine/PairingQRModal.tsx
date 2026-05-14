import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';

interface PairingQRModalProps {
  url: string;
  onClose: () => void;
}

export function PairingQRModal({ url, onClose }: PairingQRModalProps) {
  return (
    <Modal open onClose={onClose} variant="overlay">
      <div className="p-8 text-center">
        <h2 className="text-brand-darker mb-1 text-lg font-bold">Se connecter sur ton téléphone</h2>
        <p className="mb-6 text-sm text-gray-500">
          Scanne ce QR code avec l'appareil photo de ton téléphone.
        </p>

        <div className="bg-surface-soft mx-auto mb-6 inline-block rounded-2xl border border-gray-200 p-6">
          <QRCodeSVG value={url} size={256} level="M" includeMargin={false} />
        </div>

        <p className="mb-6 text-xs text-gray-400">Le code expire dans quelques minutes.</p>

        <button
          type="button"
          onClick={onClose}
          className="bg-brand hover:bg-brand-dark rounded-xl px-6 py-2.5 font-semibold text-white transition"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}
