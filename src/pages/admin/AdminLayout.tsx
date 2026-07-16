import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';

const NAV_ITEMS = [
  { to: '/admin', label: 'Accueil', end: true },
  { to: '/admin/parametres', label: 'Paramètres', end: false },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-soft text-brand-darker'
      : 'text-gray-600 hover:bg-gray-50 hover:text-brand-darker'
  }`;

function AdminNav({ className }: { className?: string }) {
  return (
    <nav className={className}>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

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
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />

          <AdminNav className="hidden gap-1 md:flex" />

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

        <AdminNav className="flex gap-1 border-t border-gray-100 px-4 py-2 md:hidden" />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
