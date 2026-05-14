import { useState, type FormEvent } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useCuisiniers, type CuisinierDoc } from '@/hooks/useCuisiniers';
import { useToast } from '@/hooks/useToast';
import { isValidPinFormat } from '@/lib/pin';
import { PinInput } from '@/components/ui/PinInput';
import { Modal } from '@/components/ui/Modal';

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

interface FormValues {
  prenom: string;
  nom: string;
  pin: string;
}

function CuisinierFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: CuisinierDoc | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => Promise<void>;
}) {
  const [prenom, setPrenom] = useState(initial?.prenom ?? '');
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [changePin, setChangePin] = useState(initial === null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!prenom.trim() || !nom.trim()) {
      setError('Prénom et nom sont requis.');
      return;
    }
    const pinNeeded = changePin || initial === null;
    if (pinNeeded) {
      if (!isValidPinFormat(pin)) {
        setError('Le PIN doit faire 4 à 6 chiffres.');
        return;
      }
      if (pin !== pinConfirm) {
        setError('Les deux PIN ne correspondent pas.');
        return;
      }
    }
    setSubmitting(true);
    try {
      await onSubmit({
        prenom: prenom.trim(),
        nom: nom.trim(),
        pin: pinNeeded ? pin : '',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open>
      <div className="p-6">
        <h2 className="text-brand-darker mb-4 text-lg font-bold">
          {initial ? 'Modifier le cuisinier' : 'Ajouter un cuisinier'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Prénom</label>
              <input
                type="text"
                required
                autoFocus
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700">Nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="focus:outline-brand w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-2"
              />
            </div>
          </div>

          {initial && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={changePin}
                onChange={(e) => setChangePin(e.target.checked)}
              />
              Changer le PIN
            </label>
          )}

          {(changePin || initial === null) && (
            <>
              <PinInput label="PIN (4 à 6 chiffres)" value={pin} onChange={setPin} />
              <PinInput label="Confirme le PIN" value={pinConfirm} onChange={setPinConfirm} />
            </>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand-dark rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
