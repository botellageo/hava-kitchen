import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { PairingQR } from '@/components/cuisine/PairingQR';
import { AppLogo } from '@/components/ui/AppLogo';
import { getInitials } from '@/lib/initials';

export default function CuisineHomePage() {
  const { user, signOut } = useAuth();
  const { restaurant, restaurantId } = useRestaurant();
  const { cuisinier, clearSession } = useCuisinierSession();
  const navigate = useNavigate();

  if (!cuisinier) {
    return <Navigate to="/cuisine" replace />;
  }

  const initials = getInitials(cuisinier.prenom, cuisinier.nom);

  async function handleLogout() {
    // Sur le téléphone du cuisinier (authentifié via custom token CF avec
    // claim role=cuisinier), on signOut Firebase Auth pour ne pas garder
    // une session côté tél. Sur l'iPad (auth gérant), on garde JB connecté.
    if (user) {
      try {
        const tokenResult = await user.getIdTokenResult();
        if (tokenResult.claims['role'] === 'cuisinier') {
          await signOut();
        }
      } catch {
        // si on n'arrive pas à lire le token, on continue
      }
    }
    clearSession();
    navigate('/cuisine', { replace: true });
  }

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />

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
              onClick={() => void handleLogout()}
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
          <Link
            to="/cuisine/temperatures"
            className="bg-surface rounded-card hover:shadow-tilehover flex flex-col border border-gray-200 p-5 transition hover:-translate-y-0.5"
          >
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              🌡️
            </div>
            <div className="text-base font-bold text-gray-900">Températures</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Lecture temps réel des frigos et congélateur.
            </div>
            <div className="text-brand-darker mt-3 text-sm font-semibold">Ouvrir →</div>
          </Link>

          <Link
            to="/cuisine/reception"
            className="bg-surface rounded-card hover:shadow-tilehover flex flex-col border border-gray-200 p-5 transition hover:-translate-y-0.5"
          >
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              📦
            </div>
            <div className="text-base font-bold text-gray-900">Réception</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Photo + auto-remplissage par IA des étiquettes fournisseur.
            </div>
            <div className="text-brand-darker mt-3 text-sm font-semibold">Ouvrir →</div>
          </Link>

          <Link
            to="/cuisine/etiquettes"
            className="bg-surface rounded-card hover:shadow-tilehover flex flex-col border border-gray-200 p-5 transition hover:-translate-y-0.5"
          >
            <div className="bg-brand-soft mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
              🏷️
            </div>
            <div className="text-base font-bold text-gray-900">Étiquettes DLC</div>
            <div className="mt-1 flex-1 text-sm text-gray-500">
              Générer une étiquette de date limite (PDF en attendant l'imprimante).
            </div>
            <div className="text-brand-darker mt-3 text-sm font-semibold">Ouvrir →</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
