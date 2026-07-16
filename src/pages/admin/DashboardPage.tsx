import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { EquipeCard } from '@/components/admin/EquipeCard';
import { TemplatesCard } from '@/components/admin/TemplatesCard';
import { EquipementsCard } from '@/components/admin/EquipementsCard';
import { ExportsDdppCard } from '@/components/admin/ExportsDdppCard';

/**
 * Espace gestion (dashboard admin) — grille de 4 cards riches façon
 * maquette PMS_04 : tout se gère inline, sans pages dédiées.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { restaurant, restaurantId } = useRestaurant();

  const greeting = user?.email?.split('@')[0] ?? 'Gérant';

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Espace manager — {greeting}</p>
          <h1 className="text-brand-darker mt-1 text-2xl font-bold md:text-3xl">⚙️ Gestion</h1>
        </div>
        <Link
          to="/cuisine"
          className="bg-brand hover:bg-brand-dark shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
        >
          Mode cuisine →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EquipeCard restaurantId={restaurantId} />
        <EquipementsCard restaurantId={restaurantId} />
        <TemplatesCard restaurantId={restaurantId} />
        <ExportsDdppCard
          restaurantId={restaurantId}
          restaurantNom={restaurant?.nom ?? 'Restaurant'}
          userEmail={user?.email ?? 'gérant'}
        />
      </div>
    </div>
  );
}
