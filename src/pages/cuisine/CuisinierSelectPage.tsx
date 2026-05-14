import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisiniers, type CuisinierDoc } from '@/hooks/useCuisiniers';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { useToast } from '@/hooks/useToast';
import { CuisinierCard } from '@/components/cuisine/CuisinierCard';
import { AddCuisinierTile } from '@/components/cuisine/AddCuisinierTile';
import { PinKeypadModal } from '@/components/cuisine/PinKeypadModal';
import { QuickAddCuisinierModal } from '@/components/cuisine/QuickAddCuisinierModal';
import { AppLogo } from '@/components/ui/AppLogo';

type QuickAddStep = null | 'manager-pin' | 'form';

export default function CuisinierSelectPage() {
  const { restaurant, restaurantId, verifyManagerPin } = useRestaurant();
  const { cuisiniers, loading, verifyCuisinierPin, addCuisinier } = useCuisiniers(restaurantId);
  const { cuisinier, setCuisinier } = useCuisinierSession();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pinTarget, setPinTarget] = useState<CuisinierDoc | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddStep>(null);

  // Si déjà loggué en cuisinier, on saute la sélection
  if (cuisinier) {
    return <Navigate to="/cuisine/home" replace />;
  }

  const cuisiniersActifs = cuisiniers.filter((c) => c.actif);

  return (
    <div className="bg-surface-softer min-h-screen">
      <header className="bg-surface border-b border-gray-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <AppLogo size="sm" brandName={restaurant?.nom ?? 'Midi 5'} />
          <Link
            to="/admin"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Espace gérant
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-brand-darker mb-1 text-2xl font-bold md:text-3xl">Bienvenue</h1>
        <p className="mb-8 text-sm text-gray-500">Choisis ton profil puis saisis ton PIN.</p>

        {loading ? (
          <div className="text-sm text-gray-500">Chargement…</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {cuisiniersActifs.map((c) => (
              <CuisinierCard
                key={c.id}
                prenom={c.prenom}
                nom={c.nom}
                onClick={() => setPinTarget(c)}
              />
            ))}
            <AddCuisinierTile onClick={() => setQuickAdd('manager-pin')} />
          </div>
        )}
      </main>

      <PinKeypadModal
        open={pinTarget !== null}
        title={pinTarget ? `${pinTarget.prenom} ${pinTarget.nom}` : ''}
        subtitle="Saisis ton PIN"
        onCancel={() => setPinTarget(null)}
        onSubmit={async (pin) => {
          if (!pinTarget) return { ok: false };
          const ok = await verifyCuisinierPin(pinTarget.id, pin);
          if (!ok) return { ok: false, message: 'PIN incorrect.' };
          setCuisinier({
            id: pinTarget.id,
            prenom: pinTarget.prenom,
            nom: pinTarget.nom,
          });
          setPinTarget(null);
          showToast({ kind: 'success', message: `Bonjour ${pinTarget.prenom}` });
          navigate('/cuisine/home', { replace: true });
          return { ok: true };
        }}
      />

      <PinKeypadModal
        open={quickAdd === 'manager-pin'}
        title="PIN gérant"
        subtitle="Pour ajouter un cuisinier sans repasser par l'admin."
        onCancel={() => setQuickAdd(null)}
        onSubmit={async (pin) => {
          const ok = await verifyManagerPin(pin);
          if (!ok) return { ok: false, message: 'PIN gérant incorrect.' };
          setQuickAdd('form');
          return { ok: true };
        }}
      />

      <QuickAddCuisinierModal
        open={quickAdd === 'form'}
        onCancel={() => setQuickAdd(null)}
        onSubmit={async ({ prenom, nom, pin }) => {
          try {
            await addCuisinier({ prenom, nom, pin });
            setQuickAdd(null);
            showToast({ kind: 'success', message: `${prenom} ajouté.` });
            return { ok: true };
          } catch (err) {
            return {
              ok: false,
              message: err instanceof Error ? err.message : 'Création impossible.',
            };
          }
        }}
      />
    </div>
  );
}
