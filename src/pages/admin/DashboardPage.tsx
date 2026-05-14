import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisiniers } from '@/hooks/useCuisiniers';

export default function DashboardPage() {
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();
  const { cuisiniers, loading } = useCuisiniers(restaurantId);

  const cuisiniersActifs = cuisiniers.filter((c) => c.actif).length;
  const greeting = user?.email?.split('@')[0] ?? 'Gérant';

  return (
    <div>
      <p className="text-sm text-gray-500">Bonjour {greeting}</p>
      <h1 className="text-brand-darker mt-1 mb-6 text-2xl font-bold md:text-3xl">Espace gestion</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/cuisiniers"
          className="bg-surface rounded-card hover:shadow-tilehover flex flex-col border border-gray-200 p-5 transition hover:-translate-y-0.5"
        >
          <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
            👥
          </div>
          <div className="text-base font-bold text-gray-900">Cuisiniers</div>
          <div className="mt-1 flex-1 text-sm text-gray-500">
            Ajouter, modifier, désactiver un membre de l'équipe.
          </div>
          <div className="text-brand-darker mt-3 text-sm font-semibold">
            {loading ? '…' : `${cuisiniersActifs} actif${cuisiniersActifs > 1 ? 's' : ''}`}
          </div>
        </Link>

        <Link
          to="/admin/parametres"
          className="bg-surface rounded-card hover:shadow-tilehover flex flex-col border border-gray-200 p-5 transition hover:-translate-y-0.5"
        >
          <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
            ⚙️
          </div>
          <div className="text-base font-bold text-gray-900">Paramètres</div>
          <div className="mt-1 flex-1 text-sm text-gray-500">
            Modifier le PIN gérant et les infos du restaurant.
          </div>
        </Link>

        <div className="bg-surface rounded-card flex flex-col border border-dashed border-gray-300 p-5">
          <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
            🍳
          </div>
          <div className="text-base font-bold text-gray-900">Mode cuisine</div>
          <div className="mt-1 flex-1 text-sm text-gray-500">
            Écran cuisinier sur tablette — disponible bientôt.
          </div>
          <div className="mt-3 text-xs text-gray-400">À venir</div>
        </div>
      </div>
    </div>
  );
}
