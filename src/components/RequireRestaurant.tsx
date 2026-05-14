import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';

/**
 * Guard à utiliser dans les routes qui exigent qu'un restaurant existe pour l'utilisateur connecté.
 * Si pas de resto pour cet ownerUid → redirige vers /setup.
 * Doit être imbriqué dans <ProtectedRoute>.
 */
export function RequireRestaurant({ children }: { children: ReactNode }) {
  const { restaurant, loading, error } = useRestaurant();

  if (loading) {
    return (
      <div className="bg-surface-softer flex min-h-screen items-center justify-center">
        <div className="text-brand-darker text-sm">Chargement du restaurant…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-card border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-semibold">Impossible de charger le restaurant.</p>
          <p className="mt-2 text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
