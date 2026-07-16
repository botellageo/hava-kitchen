import { useState } from 'react';
import { useCuisiniers, type CuisinierDoc } from '@/hooks/useCuisiniers';
import { useToast } from '@/hooks/useToast';
import { CuisinierFormModal } from '@/components/admin/CuisinierFormModal';
import { AdminCard, AdminCardRow, RowButton, FooterButton } from '@/components/admin/AdminCard';

type EditMode = { mode: 'add' } | { mode: 'edit'; cuisinier: CuisinierDoc };

interface EquipeCardProps {
  restaurantId: string | null;
}

/** Card Équipe du dashboard : gestion inline des cuisiniers (façon maquette). */
export function EquipeCard({ restaurantId }: EquipeCardProps) {
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
    <AdminCard
      icon="👥"
      title="Équipe"
      footer={
        <FooterButton onClick={() => setEditing({ mode: 'add' })}>+ Ajouter un membre</FooterButton>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : cuisiniers.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Pas encore de cuisinier — ajoute le premier ci-dessous.
        </p>
      ) : (
        cuisiniers.map((c) => (
          <AdminCardRow
            key={c.id}
            left={
              <div className={`flex items-center gap-3 ${c.actif ? '' : 'opacity-50'}`}>
                <div className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                  {c.prenom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-900">
                    {c.prenom} {c.nom}
                  </div>
                  <div className="text-xs text-gray-500">{c.actif ? 'PIN actif' : 'Désactivé'}</div>
                </div>
              </div>
            }
            right={
              <>
                <RowButton onClick={() => setEditing({ mode: 'edit', cuisinier: c })}>
                  Modifier
                </RowButton>
                <RowButton onClick={() => void handleToggle(c)}>
                  {c.actif ? 'Désactiver' : 'Réactiver'}
                </RowButton>
                <RowButton danger onClick={() => void handleDelete(c)}>
                  Supprimer
                </RowButton>
              </>
            }
          />
        ))
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
    </AdminCard>
  );
}
