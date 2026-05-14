import { useEffect, useState } from 'react';
import { NumericKeypad } from './NumericKeypad';

interface PinKeypadModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  /** Longueur attendue du PIN (4-6). Si défini, soumission auto à cette longueur. */
  expectedLength?: number;
  onCancel: () => void;
  /** Doit retourner `{ ok: true }` si PIN valide, sinon `{ ok: false, message? }`. */
  onSubmit: (pin: string) => Promise<{ ok: true } | { ok: false; message?: string }>;
}

const MIN_PIN = 4;
const MAX_PIN = 6;

export function PinKeypadModal({
  open,
  title,
  subtitle,
  expectedLength,
  onCancel,
  onSubmit,
}: PinKeypadModalProps) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset du PIN saisi à chaque ouverture du modal (état dérivé d'une prop).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setPin('');
      setError(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const attemptSubmit = async (candidate: string) => {
    if (submitting) return;
    if (candidate.length < MIN_PIN) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit(candidate);
      if (!result.ok) {
        setError(result.message ?? 'PIN incorrect.');
        setPin('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PIN incorrect.');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (next: string) => {
    setError(null);
    setPin(next);
    if (expectedLength && next.length === expectedLength) {
      void attemptSubmit(next);
    }
  };

  if (!open) return null;

  const targetLength = expectedLength ?? MAX_PIN;
  const dots = Array.from({ length: targetLength }, (_, i) => i);
  const canValidate = !expectedLength && pin.length >= MIN_PIN;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="shadow-modal w-full max-w-sm rounded-2xl bg-white p-6">
        <div className="mb-4 text-center">
          <h2 className="text-brand-darker text-lg font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        <div className="mb-6 flex justify-center gap-3" aria-live="polite">
          {dots.map((i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition ${
                i < pin.length ? 'bg-brand scale-110' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <NumericKeypad
          value={pin}
          onChange={handleChange}
          maxLength={MAX_PIN}
          disabled={submitting}
        />

        <div className="mt-5 flex justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          {canValidate && (
            <button
              type="button"
              onClick={() => void attemptSubmit(pin)}
              disabled={submitting}
              className="bg-brand hover:bg-brand-dark rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {submitting ? 'Vérification…' : 'Valider'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
