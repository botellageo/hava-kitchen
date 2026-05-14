import { Navigate, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { PairingQR } from '@/components/cuisine/PairingQR';

export default function CuisineHomePage() {
  const { restaurant, restaurantId } = useRestaurant();
  const { cuisinier, clearSession } = useCuisinierSession();
  const navigate = useNavigate();

  if (!cuisinier) {
    return <Navigate to="/cuisine" replace />;
  }

  const initials = `${cuisinier.prenom.charAt(0)}${cuisinier.nom.charAt(0)}`.toUpperCase();

  function handleLogout() {
    clearSession();
    navigate('/cuisine', { replace: true });
  }

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="from-brand to-brand-dark flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold text-white">
              M5
            </div>
            <div>
              <div className="text-brand-darker text-base leading-tight font-bold">
                {restaurant?.nom ?? 'Midi 5'}
              </div>
              <div className="text-[10px] font-medium tracking-widest text-gray-500">
                SUIVI HYGIÈNE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User chip avec emplacement QR pairing (généré en Step 12) */}
            <div className="bg-surface-softer flex items-center gap-2.5 rounded-chip py-1 pr-3 pl-1">
              <div className="bg-brand flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white">
                {initials}
              </div>
              <span className="text-sm font-semibold text-gray-900">{cuisinier.prenom}</span>
              {restaurantId && (
                <span className="ml-1">
                  <PairingQR restaurantId={restaurantId} cuisinierId={cuisinier.id} />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Changer d'utilisateur
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <p className="text-sm text-gray-500">Bonjour</p>
        <h1 className="text-brand-darker mt-1 mb-6 text-2xl font-bold md:text-3xl">
          {cuisinier.prenom}
        </h1>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-surface rounded-card flex flex-col border border-dashed border-gray-300 p-5">
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              🌡️
            </div>
            <div className="text-base font-bold text-gray-900">Températures</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Lecture frigos et congélateurs. À venir quand les sondes seront livrées.
            </div>
            <div className="mt-3 text-xs text-gray-400">À venir</div>
          </div>

          <div className="bg-surface rounded-card flex flex-col border border-dashed border-gray-300 p-5">
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              📦
            </div>
            <div className="text-base font-bold text-gray-900">Réception</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Photo + auto-remplissage par IA. À venir.
            </div>
            <div className="mt-3 text-xs text-gray-400">À venir</div>
          </div>

          <div className="bg-surface rounded-card flex flex-col border border-dashed border-gray-300 p-5">
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              🏷️
            </div>
            <div className="text-base font-bold text-gray-900">Étiquettes DLC</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Impression sur Brother QL-820NWB. À venir quand l'imprimante sera livrée.
            </div>
            <div className="mt-3 text-xs text-gray-400">À venir</div>
          </div>
        </div>
      </main>
    </div>
  );
}
