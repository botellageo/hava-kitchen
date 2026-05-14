interface AddCuisinierTileProps {
  onClick: () => void;
}

export function AddCuisinierTile({ onClick }: AddCuisinierTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-brand-darker hover:bg-brand-soft active:bg-brand-soft flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-brand/40 p-5 transition hover:-translate-y-0.5 md:p-6"
    >
      <div className="bg-brand-soft text-brand-dark flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold md:h-20 md:w-20 md:text-4xl">
        +
      </div>
      <div className="text-base font-bold md:text-lg">Ajouter</div>
      <div className="text-xs text-gray-500">un cuisinier</div>
    </button>
  );
}
