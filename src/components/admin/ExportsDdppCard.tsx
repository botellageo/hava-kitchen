import { useState } from 'react';
import { useExportsDdpp, type ExportDdppDoc } from '@/hooks/useExportsDdpp';
import { useToast } from '@/hooks/useToast';
import { getRegistreData } from '@/lib/registreData';
import { generateRegistrePdf, formatMoisFr } from '@/lib/generateRegistrePdf';
import { AdminCard, AdminCardRow, RowButton, FooterButton } from '@/components/admin/AdminCard';

interface ExportsDdppCardProps {
  restaurantId: string | null;
  restaurantNom: string;
  /** Identité du gérant (email) tracée dans l'historique d'exports. */
  userEmail: string;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatGenereLe(x: ExportDdppDoc): string {
  const d = x.createdAt.toDate();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `Généré le ${dd}/${mm} par ${x.createdBy.split('@')[0] ?? x.createdBy}`;
}

/**
 * Card Exports DDPP : génération du registre mensuel (PDF) + historique.
 * « Télécharger » regénère le PDF à la volée depuis les collections
 * immutables — le document est donc toujours fidèle aux données tracées.
 */
export function ExportsDdppCard({ restaurantId, restaurantNom, userEmail }: ExportsDdppCardProps) {
  const { exports, loading, addExport } = useExportsDdpp(restaurantId);
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function download(mois: string): Promise<{ nbReceptions: number; nbEtiquettes: number }> {
    if (!restaurantId) throw new Error('Aucun restaurant courant');
    const { receptions, etiquettes } = await getRegistreData(restaurantId, mois);
    generateRegistrePdf({ restaurantNom, mois, receptions, etiquettes });
    return { nbReceptions: receptions.length, nbEtiquettes: etiquettes.length };
  }

  async function handleDownload(mois: string) {
    setBusy(true);
    try {
      await download(mois);
      showToast({ kind: 'success', message: `Registre ${formatMoisFr(mois)} téléchargé.` });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Téléchargement impossible.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    const mois = currentMonthKey();
    setBusy(true);
    try {
      const { nbReceptions, nbEtiquettes } = await download(mois);
      await addExport({ mois, nbReceptions, nbEtiquettes, createdBy: userEmail });
      showToast({ kind: 'success', message: `Registre ${formatMoisFr(mois)} généré.` });
    } catch (err) {
      showToast({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Génération impossible.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminCard
      icon="📄"
      title="Exports DDPP"
      footer={
        <FooterButton primary disabled={busy} onClick={() => void handleGenerate()}>
          {busy ? 'Génération…' : 'Générer le registre du mois en cours'}
        </FooterButton>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : exports.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Aucun registre généré pour l'instant. En cas de contrôle, tout l'historique reste
          exportable.
        </p>
      ) : (
        exports.map((x) => (
          <AdminCardRow
            key={x.id}
            left={
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900 capitalize">
                  {formatMoisFr(x.mois)}
                </div>
                <div className="truncate text-xs text-gray-500">{formatGenereLe(x)}</div>
              </div>
            }
            right={
              <RowButton disabled={busy} onClick={() => void handleDownload(x.mois)}>
                Télécharger
              </RowButton>
            }
          />
        ))
      )}
    </AdminCard>
  );
}
