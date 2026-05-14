interface PinInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (next: string) => void;
  /** Longueur max (4-6 selon contexte). Défaut 6. */
  maxLength?: number;
  required?: boolean;
  autoFocus?: boolean;
  /** ARIA label si pas de label visible. */
  ariaLabel?: string;
}

/**
 * Input password numérique (4-6 chiffres) avec mise en forme tracking.
 * Filtre les caractères non-numériques et limite la longueur à `maxLength`.
 * Utilisé pour PIN cuisinier, PIN gérant, etc.
 */
export function PinInput({
  id,
  label,
  value,
  onChange,
  maxLength = 6,
  required = false,
  autoFocus = false,
  ariaLabel,
}: PinInputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="\d{4,6}"
        autoComplete="new-password"
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, maxLength))}
        maxLength={maxLength}
        className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl tracking-[0.4em] focus:outline-2 focus:-outline-offset-1"
      />
    </div>
  );
}
