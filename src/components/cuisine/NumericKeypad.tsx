interface NumericKeypadProps {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  /** Désactive toutes les touches (pendant une soumission par ex.) */
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Clavier numérique tactile pour saisie de PIN sur tablette cuisine.
 * Boutons larges (aspect-ratio 1.4), feedback tactile au clic.
 */
export function NumericKeypad({
  value,
  onChange,
  maxLength = 6,
  disabled = false,
}: NumericKeypadProps) {
  const append = (digit: string) => {
    if (disabled) return;
    if (value.length >= maxLength) return;
    onChange(value + digit);
  };

  const clear = () => {
    if (disabled) return;
    onChange('');
  };

  const backspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const keyClass =
    'aspect-[1.4/1] rounded-xl border border-gray-200 bg-gray-50 text-2xl font-semibold text-gray-900 transition active:scale-95 active:bg-brand-soft disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="grid grid-cols-3 gap-2.5" role="group" aria-label="Clavier numérique">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => append(k)}
          disabled={disabled}
          aria-label={`Chiffre ${k}`}
          className={keyClass}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={clear}
        disabled={disabled || value.length === 0}
        aria-label="Effacer"
        className={`${keyClass} text-base text-red-500`}
      >
        Effacer
      </button>
      <button
        type="button"
        onClick={() => append('0')}
        disabled={disabled}
        aria-label="Chiffre 0"
        className={keyClass}
      >
        0
      </button>
      <button
        type="button"
        onClick={backspace}
        disabled={disabled || value.length === 0}
        aria-label="Reculer"
        className={`${keyClass} text-xl`}
      >
        ⌫
      </button>
    </div>
  );
}
