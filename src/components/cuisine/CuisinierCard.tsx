interface CuisinierCardProps {
  prenom: string;
  nom: string;
  onClick: () => void;
  disabled?: boolean;
}

export function CuisinierCard({ prenom, nom, onClick, disabled = false }: CuisinierCardProps) {
  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="bg-surface rounded-card hover:shadow-tilehover active:bg-brand-soft flex flex-col items-center justify-center gap-2 border-2 border-transparent p-5 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 md:p-6"
    >
      <div className="from-brand to-brand-dark flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-xl font-bold text-white md:h-20 md:w-20 md:text-2xl">
        {initials}
      </div>
      <div className="text-base font-bold text-gray-900 md:text-lg">{prenom}</div>
      <div className="text-xs text-gray-500">{nom}</div>
    </button>
  );
}
