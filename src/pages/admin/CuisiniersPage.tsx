import { useState } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisiniers, type CuisinierDoc } from '@/hooks/useCuisiniers';
import { useToast } from '@/hooks/useToast';
import { CuisinierFormModal } from '@/components/admin/CuisinierFormModal';

type EditMode = { mode: 'add' } | { mode: 'edit'; cuisinier: CuisinierDoc };

export default function CuisiniersPage() {
  const { restaurantId } = useRestaurant();
  const { cuisiniers, loading, addCuisinier, updateCuisinier, toggleActif, deleteCuisinier } =
    useCuisiniers(restaurantId);
  const { showToast } = useToast();
  const [editing, setEditing] = useState<EditMode | null>(null);

  async function handleToggle(c: CuisinierDoc) {
    try {
      await toggleActif(c.id, !c.actif);
      showToast({
        kind: 'success',
        message: !c.actif ? `${c.prenom} réactivé.` : `${c.prenom} désactivé.`,
      });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Modification impossible.',
      });
    }
  }

  async function handleDelete(c: CuisinierDoc) {
    if (!confirm(`Supprimer définitivement ${c.prenom} ${c.nom} ? Cette action est irréversible.`))
      return;
    try {
      await deleteCuisinier(c.id);
      showToast({ kind: 'success', message: `${c.prenom} supprimé.` });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Suppression impossible.',
      });
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-brand-darker text-2xl font-bold md:text-3xl">Cuisiniers</h1>
        <button
          type="button"
          onClick={() => setEditing({ mode: 'add' })}
          className="bg-brand hover:bg-brand-dark rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
        >
          + Ajouter
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Chargement…</div>
      ) : cuisiniers.length === 0 ? (
        <div className="bg-surface rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Pas encore de cuisinier.</p>
          <p className="mt-1 text-sm text-gray-400">Ajoute le premier avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <ul className="bg-surface divide-y divide-gray-100 rounded-card border border-gray-200">
          {cuisiniers.map((c) => (
            <li
              key={c.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 ${c.actif ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {c.prenom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {c.prenom} {c.nom}
                  </div>
                  <div className="text-xs text-gray-500">{c.actif ? 'PIN actif' : 'Désactivé'}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ mode: 'edit', cuisinier: c })}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggle(c)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {c.actif ? 'Désactiver' : 'Réactiver'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(c)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CuisinierFormModal
          initial={editing.mode === 'edit' ? editing.cuisinier : null}
          onClose={() => setEditing(null)}
          onSubmit={async ({ prenom, nom, pin }) => {
            try {
              if (editing.mode === 'add') {
                if (!pin) throw new Error('PIN requis');
                await addCuisinier({ prenom, nom, pin });
                showToast({ kind: 'success', message: `${prenom} ajouté.` });
              } else {
                await updateCuisinier(editing.cuisinier.id, {
                  prenom,
                  nom,
                  ...(pin ? { pin } : {}),
                });
                showToast({ kind: 'success', message: `${prenom} mis à jour.` });
              }
              setEditing(null);
            } catch (err) {
              showToast({
                kind: 'error',
                message: err instanceof Error ? err.message : 'Erreur',
              });
            }
          }}
        />
      )}
    </div>
  );
}
