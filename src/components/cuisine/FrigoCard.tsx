import { formatTemp, type DemoFrigo } from '@/lib/demoTemperatures';

interface FrigoCardProps {
  frigo: DemoFrigo;
}

/**
 * Carte équipement froid de l'écran Températures (façon maquette PMS_04) :
 * nom + pastille de statut, usage, température en gros, plage cible,
 * fraîcheur de la dernière lecture.
 */
export function FrigoCard({ frigo }: FrigoCardProps) {
  const [min, max] = frigo.plage;
  const enPlage = frigo.temp >= min && frigo.temp <= max;

  return (
    <div className="bg-surface rounded-card border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-base font-bold text-gray-900">
        {frigo.nom}
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${enPlage ? 'bg-brand' : 'bg-alert'}`}
          aria-label={enPlage ? 'Dans la plage cible' : 'Hors plage cible'}
        />
      </div>
      <div className="mt-0.5 text-xs text-gray-500">{frigo.usage}</div>
      <div className="text-brand-darker mt-3 text-4xl font-bold">
        {formatTemp(frigo.temp)}
        <span className="ml-1 text-lg font-semibold text-gray-400">°C</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Plage cible : {min} à {max} °C
      </div>
      <div className="mt-1 text-xs text-gray-400">
        Dernière lecture il y a {frigo.minutesAgo} min
      </div>
    </div>
  );
}
