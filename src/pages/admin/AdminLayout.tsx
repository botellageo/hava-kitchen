import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-soft text-brand-darker'
      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-darker'
  }`;

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { restaurant } = useRestaurant();
  const { showToast } = useToast();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      showToast({ kind: 'error', message: 'Déconnexion impossible.' });
    }
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

          <nav className="hidden gap-1 md:flex">
            <NavLink to="/admin" end className={navLinkClass}>
              Accueil
            </NavLink>
            <NavLink to="/admin/cuisiniers" className={navLinkClass}>
              Cuisiniers
            </NavLink>
            <NavLink to="/admin/parametres" className={navLinkClass}>
              Paramètres
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            {user?.email && (
              <span className="hidden text-xs text-gray-500 md:inline">{user.email}</span>
            )}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <nav className="flex gap-1 border-t border-gray-100 px-4 py-2 md:hidden">
          <NavLink to="/admin" end className={navLinkClass}>
            Accueil
          </NavLink>
          <NavLink to="/admin/cuisiniers" className={navLinkClass}>
            Cuisiniers
          </NavLink>
          <NavLink to="/admin/parametres" className={navLinkClass}>
            Paramètres
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
