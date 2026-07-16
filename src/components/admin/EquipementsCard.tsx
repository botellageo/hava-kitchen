import { useState } from 'react';
import { useEquipements, type EquipementDoc } from '@/hooks/useEquipements';
import { useToast } from '@/hooks/useToast';
import { EquipementFormModal } from '@/components/admin/EquipementFormModal';
import { AdminCard, AdminCardRow, RowButton, FooterButton } from '@/components/admin/AdminCard';

type EditMode = { mode: 'add' } | { mode: 'edit'; equipement: EquipementDoc };

interface EquipementsCardProps {
  restaurantId: string | null;
}

function formatSeuils(e: EquipementDoc): string {
  const sonde = e.sondeId ? `Sonde : ${e.sondeId} — ` : '';
  return `${sonde}Seuils ${e.seuilMin}/${e.seuilMax} °C`;
}

/**
 * Card Frigos & sondes du dashboard : config des équipements froid.
 * Le badge « OK » est statique tant que le module Températures (sondes)
 * n'existe pas — aucune valeur de température n'est affichée.
 */
export function EquipementsCard({ restaurantId }: EquipementsCardProps) {
  const { equipements, loading, addEquipement, updateEquipement, deleteEquipement, seedDemo } =
    useEquipements(restaurantId);
  const { showToast } = useToast();
  const [editing, setEditing] = useState<EditMode | null>(null);
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDemo();
      showToast({ kind: 'success', message: 'Équipements de démo créés.' });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Pré-remplissage impossible.',
      });
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(e: EquipementDoc) {
    if (!confirm(`Supprimer l'équipement "${e.nom}" ?`)) return;
    try {
      await deleteEquipement(e.id);
      showToast({ kind: 'success', message: `${e.nom} supprimé.` });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Suppression impossible.',
      });
    }
  }

  const isEmpty = !loading && equipements.length === 0;

  return (
    <AdminCard
      icon="❄️"
      title="Frigos & sondes"
      footer={
        isEmpty ? (
          <div className="flex flex-col gap-2">
            <FooterButton onClick={() => setEditing({ mode: 'add' })}>
              + Ajouter un équipement
            </FooterButton>
            <FooterButton onClick={() => void handleSeed()} disabled={seeding}>
              {seeding ? 'Création…' : 'Pré-remplir (démo)'}
            </FooterButton>
          </div>
        ) : (
          <FooterButton onClick={() => setEditing({ mode: 'add' })}>
            + Ajouter un équipement
          </FooterButton>
        )
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : isEmpty ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Pas encore d'équipement — ajoute tes frigos ou pré-remplis pour une démo.
        </p>
      ) : (
        equipements.map((e) => (
          <AdminCardRow
            key={e.id}
            left={
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900">{e.nom}</div>
                <div className="truncate text-xs text-gray-500">{formatSeuils(e)}</div>
              </div>
            }
            right={
              <>
                <span className="bg-brand-soft text-brand-darker rounded-full px-2.5 py-0.5 text-xs font-bold">
                  OK
                </span>
                <RowButton onClick={() => setEditing({ mode: 'edit', equipement: e })}>
                  Modifier
                </RowButton>
                <RowButton danger onClick={() => void handleDelete(e)}>
                  Supprimer
                </RowButton>
              </>
            }
          />
        ))
      )}

      {editing && (
        <EquipementFormModal
          initial={editing.mode === 'edit' ? editing.equipement : null}
          onClose={() => setEditing(null)}
          onSubmit={async (values) => {
            try {
              if (editing.mode === 'add') {
                await addEquipement(values);
                showToast({ kind: 'success', message: `${values.nom} ajouté.` });
              } else {
                await updateEquipement(editing.equipement.id, values);
                showToast({ kind: 'success', message: `${values.nom} mis à jour.` });
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
