import { useState } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useProductTemplates, type ProductTemplateDoc } from '@/hooks/useProductTemplates';
import { useToast } from '@/hooks/useToast';
import { ProductTemplateFormModal } from '@/components/admin/ProductTemplateFormModal';

type EditMode = { mode: 'add' } | { mode: 'edit'; template: ProductTemplateDoc };

export default function TemplatesPage() {
  const { restaurantId } = useRestaurant();
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-brand-darker text-2xl font-bold md:text-3xl">Produits</h1>
        <button
          type="button"
          onClick={() => setEditing({ mode: 'add' })}
          className="bg-brand hover:bg-brand-dark rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
        >
          + Ajouter
        </button>
      </div>

      <p className="mb-6 text-sm text-gray-500">
        Configure les produits que ton équipe étiquette en cuisine. Le nombre de jours DLC est
        utilisé pour calculer la date limite automatiquement à l'impression.
      </p>

      {loading ? (
        <div className="text-sm text-gray-500">Chargement…</div>
      ) : templates.length === 0 ? (
        <div className="bg-surface rounded-card border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">Pas encore de produit.</p>
          <p className="mt-1 text-sm text-gray-400">
            Ajoute ton premier (ex : "Tartare de saumon — DLC + 3 j").
          </p>
        </div>
      ) : (
        <ul className="bg-surface divide-y divide-gray-100 rounded-card border border-gray-200">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="font-semibold text-gray-900">{t.nom}</div>
                <div className="text-xs text-gray-500">
                  DLC + {t.dlcDays} jour{t.dlcDays > 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ mode: 'edit', template: t })}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t)}
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
    </div>
  );
}
