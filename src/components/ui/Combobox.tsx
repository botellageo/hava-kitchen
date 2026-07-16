import { useEffect, useRef, useState } from 'react';

interface ComboboxOption {
  id: string;
  label: string;
  hint?: string;
}

interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Appelé quand l'utilisateur clique sur une option (vs taper texte libre) */
  onSelectOption?: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}

/**
 * Combobox custom : input texte avec dropdown filtrant.
 * - Tape → filtre les options par préfixe (case-insensitive, ignore les espaces)
 * - Clic flèche → ouvre la liste complète
 * - Clic option → sélectionne
 * - Texte libre autorisé (si pas dans la liste, l'utilisateur peut créer)
 *
 * Pourquoi pas `<datalist>` ? Le rendu natif est piloté par le navigateur
 * (dark mode forcé, contraste variable) — un combobox custom donne un look
 * cohérent avec le reste de l'UI.
 */
export function Combobox({
  id,
  value,
  onChange,
  onSelectOption,
  options,
  placeholder,
  required = false,
  autoFocus = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtre par sous-chaîne case-insensitive. Si input vide, affiche tout.
  const cleanValue = value.trim().toLowerCase();
  const filtered = cleanValue
    ? options.filter((o) => o.label.toLowerCase().includes(cleanValue))
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="focus:outline-brand w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-9 text-base focus:outline-2"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir la liste"
          tabIndex={-1}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0l-4.25-4.39a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="shadow-card absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(opt.label);
                  onSelectOption?.(opt);
                  setOpen(false);
                }}
                className="hover:bg-brand-soft flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition"
              >
                <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                {opt.hint && <span className="text-xs text-gray-500">{opt.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
