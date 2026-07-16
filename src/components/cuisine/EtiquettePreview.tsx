interface EtiquettePreviewProps {
  produit: string;
  prodDate: string;
  dlc: string;
  lot?: string;
  operateur: string;
}

function formatDateFr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Aperçu visuel de l'étiquette à la taille réelle approximative (62×29mm).
 * Reproduit fidèlement le rendu de la maquette HTML.
 */
export function EtiquettePreview({
  produit,
  prodDate,
  dlc,
  lot,
  operateur,
}: EtiquettePreviewProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <div
        className="mx-auto rounded border border-gray-900 bg-white p-3 text-left shadow"
        style={{ width: '220px' }}
      >
        <div className="text-sm leading-tight font-bold text-black">{produit || '—'}</div>
        <div className="mt-1 text-[10px] leading-tight text-gray-700">
          Préparé le {formatDateFr(prodDate)} — {operateur}
          {lot && (
            <>
              <br />
              Lot : {lot}
            </>
          )}
        </div>
        <div className="mt-2 border-t border-dashed border-gray-300 pt-1.5 text-[10px]">
          À consommer jusqu'au
          <br />
          <strong className="text-base text-red-700">{formatDateFr(dlc)}</strong>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-gray-400">Format 62 × 29 mm</div>
    </div>
  );
}
