import { Link, Navigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { AppLogo } from '@/components/ui/AppLogo';
import { FrigoCard } from '@/components/cuisine/FrigoCard';
import { TemperatureChart } from '@/components/cuisine/TemperatureChart';
import { DEMO_FRIGOS } from '@/lib/demoTemperatures';

/**
 * Écran Températures (façon maquette PMS_04) — données SIMULÉES tant que
 * les sondes ne sont pas livrées. Bandeau discret pour la transparence.
 */
export default function TemperaturesPage() {
  const { restaurant, restaurantId, loading: restaurantLoading } = useRestaurant();
  const { cuisinier } = useCuisinierSession();

  if (!cuisinier) {
    return <Navigate to="/cuisine" replace />;
  }
  if (restaurantLoading) {
    return (
      <div className="bg-surface-softer flex min-h-screen items-center justify-center">
        <div className="text-brand-darker text-sm">Chargement…</div>
      </div>
    );
  }
  if (!restaurantId) {
    return <Navigate to="/cuisine/home" replace />;
  }

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />
          <Link
            to="/cuisine/home"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
          >
            ← Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <p className="text-sm text-gray-500">Module</p>
        <h1 className="text-brand-darker mt-1 mb-4 text-2xl font-bold md:text-3xl">
          🌡️ Températures
        </h1>

        <div className="bg-info-soft text-info-darker mb-6 rounded-lg px-4 py-2.5 text-xs">
          Aperçu — données simulées, sondes en cours d'installation.
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {DEMO_FRIGOS.map((frigo) => (
            <FrigoCard key={frigo.nom} frigo={frigo} />
          ))}
        </div>

        <div className="mt-4">
          <TemperatureChart />
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-400"
          >
            📝 Saisie manuelle (à venir)
          </button>
          <button
            type="button"
            disabled
            className="flex-1 cursor-not-allowed rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-400"
          >
            📄 Exporter PDF (à venir)
          </button>
        </div>
      </main>
    </div>
  );
}
