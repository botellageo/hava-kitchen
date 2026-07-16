import { jsPDF } from 'jspdf';

/**
 * Convertit une date ISO YYYY-MM-DD en format français DD/MM/YYYY.
 * Retourne la chaîne brute si format inattendu.
 */
function formatDateFr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Calcule la DLC = prodDate + N jours (format ISO YYYY-MM-DD).
 */
export function calculateDlc(prodDate: string, dlcDays: number): string {
  const d = new Date(`${prodDate}T00:00:00`);
  d.setDate(d.getDate() + dlcDays);
  return d.toISOString().slice(0, 10);
}

export interface EtiquetteData {
  produit: string;
  prodDate: string;
  dlc: string;
  lot?: string;
  operateur: string;
  qte: number;
}

/**
 * Génère et déclenche le téléchargement d'un PDF contenant N étiquettes (1 par page).
 * Format : 62×29 mm landscape (Brother QL-820NWB compatible).
 *
 * Tant que l'imprimante Brother n'est pas livrée, on simule via PDF.
 */
export function generateEtiquettePdf(data: EtiquetteData): void {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [62, 29],
  });

  for (let i = 0; i < data.qte; i++) {
    if (i > 0) pdf.addPage([62, 29], 'landscape');

    // Nom produit (gros, en haut)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(data.produit, 3, 5, { maxWidth: 56 });

    // Méta (préparation + opérateur)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.text(`Préparé le ${formatDateFr(data.prodDate)} - ${data.operateur}`, 3, 12);
    if (data.lot) {
      pdf.text(`Lot : ${data.lot}`, 3, 15);
    }

    // Séparateur
    pdf.setLineDashPattern([0.5, 0.5], 0);
    pdf.line(3, 17, 59, 17);

    // DLC
    pdf.setFontSize(5);
    pdf.text("À consommer jusqu'au", 3, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(185, 28, 28); // rouge DLC
    pdf.text(formatDateFr(data.dlc), 3, 27);
    pdf.setTextColor(0, 0, 0);
  }

  const filename = `etiquette-${data.produit
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30)}-${data.prodDate}.pdf`;
  pdf.save(filename);
}
