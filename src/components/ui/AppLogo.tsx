interface AppLogoProps {
  /** sm = header (h-9), md = pages d'accueil/auth (h-10). Défaut md. */
  size?: 'sm' | 'md';
  /** Si false, affiche uniquement le carré M5 sans le texte brand. */
  showBrand?: boolean;
  /** Override du nom affiché (par défaut "Midi 5"). */
  brandName?: string;
}

/**
 * Logo M5 sur gradient emerald + brand "Midi 5 / SUIVI HYGIÈNE".
 * Composant centralisé pour éviter la duplication entre pages.
 */
export function AppLogo({ size = 'md', showBrand = true, brandName = 'Midi 5' }: AppLogoProps) {
  const square = size === 'sm' ? 'h-9 w-9 rounded-lg text-sm' : 'h-10 w-10 rounded-xl text-base';
  const nameClass = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className={`from-brand to-brand-dark flex items-center justify-center bg-gradient-to-br font-bold text-white ${square}`}
      >
        M5
      </div>
      {showBrand && (
        <div>
          <div className={`text-brand-darker leading-tight font-bold ${nameClass}`}>
            {brandName}
          </div>
          <div className="text-[10px] font-medium tracking-widest text-gray-500">SUIVI HYGIÈNE</div>
        </div>
      )}
    </div>
  );
}
