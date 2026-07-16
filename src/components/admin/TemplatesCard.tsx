import { useState } from 'react';
import { useProductTemplates, type ProductTemplateDoc } from '@/hooks/useProductTemplates';
import { useToast } from '@/hooks/useToast';
import { ProductTemplateFormModal } from '@/components/ui/ProductTemplateFormModal';
import { AdminCard, AdminCardRow, RowButton, FooterButton } from '@/components/admin/AdminCard';

type EditMode = { mode: 'add' } | { mode: 'edit'; template: ProductTemplateDoc };

interface TemplatesCardProps {
  restaurantId: string | null;
}

/** Card Templates produits du dashboard : gestion inline des produits/DLC. */
export function TemplatesCard({ restaurantId }: TemplatesCardProps) {
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } =
    useProductTemplates(restaurantId);
  const { showToast } = useToast();
  const [editing, setEditing] = useState<EditMode | null>(null);

  async function handleDelete(t: ProductTemplateDoc) {
    if (
      !confirm(
        `Supprimer le produit "${t.nom}" ? Les étiquettes déjà imprimées ne seront pas affectées.`,
      )
    )
      return;
    try {
      await deleteTemplate(t.id);
      showToast({ kind: 'success', message: `${t.nom} supprimé.` });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Suppression impossible.',
      });
    }
  }

  return (
    <AdminCard
      icon="📋"
      title="Templates produits"
      footer={
        <FooterButton onClick={() => setEditing({ mode: 'add' })}>
          + Ajouter un produit
        </FooterButton>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : templates.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Pas encore de produit (ex : « Tartare de saumon — DLC + 3 j »).
        </p>
      ) : (
        templates.map((t) => (
          <AdminCardRow
            key={t.id}
            left={
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900">{t.nom}</div>
                <div className="text-xs text-gray-500">DLC + {t.dlcDays} j</div>
              </div>
            }
            right={
              <>
                <RowButton onClick={() => setEditing({ mode: 'edit', template: t })}>
                  Modifier
                </RowButton>
                <RowButton danger onClick={() => void handleDelete(t)}>
                  Supprimer
                </RowButton>
              </>
            }
          />
        ))
      )}

      {editing && (
        <ProductTemplateFormModal
          initial={editing.mode === 'edit' ? editing.template : null}
          onClose={() => setEditing(null)}
          onSubmit={async ({ nom, dlcDays }) => {
            try {
              if (editing.mode === 'add') {
                await addTemplate({ nom, dlcDays });
                showToast({ kind: 'success', message: `${nom} ajouté.` });
              } else {
                await updateTemplate(editing.template.id, { nom, dlcDays });
                showToast({ kind: 'success', message: `${nom} mis à jour.` });
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
