import { jsPDF } from 'jspdf';
import type { Timestamp } from 'firebase/firestore';
import type { EtiquetteRegistre, ReceptionRegistre } from '@/lib/registreData';
import { formatDateFr } from '@/lib/dateFormat';

const MOIS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** 'YYYY-MM' → 'juillet 2026'. Retourne la chaîne brute si format inattendu. */
export function formatMoisFr(mois: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(mois);
  if (!match) return mois;
  const label = MOIS_FR[Number(match[2]) - 1];
  return label ? `${label} ${match[1]}` : mois;
}

function formatTsFr(ts: Timestamp): string {
  const d = ts.toDate();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Tronque un texte pour qu'il tienne sur UNE ligne de la colonne
 * (ROW_HEIGHT fixe → pas de retour à la ligne possible sans chevauchement).
 */
function fitCell(pdf: jsPDF, text: string, width: number): string {
  if (pdf.getTextWidth(text) <= width) return text;
  let t = text;
  while (t.length > 1 && pdf.getTextWidth(`${t}…`) > width) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

// Layout A4 portrait (210 × 297 mm)
const MARGIN_X = 14;
const PAGE_WIDTH = 210;
const PAGE_BOTTOM = 280;
const ROW_HEIGHT = 7;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;

interface TableSpec {
  title: string;
  headers: string[];
  /** Largeurs de colonnes en mm — la somme doit faire CONTENT_WIDTH. */
  colWidths: number[];
  rows: string[][];
  emptyMessage: string;
}

function drawSection(pdf: jsPDF, startY: number, spec: TableSpec): number {
  let y = startY;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(spec.title, MARGIN_X, y);
  y += 7;

  if (spec.rows.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text(spec.emptyMessage, MARGIN_X, y);
    pdf.setTextColor(0, 0, 0);
    return y + 10;
  }

  const drawHeader = () => {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(MARGIN_X, y - 4.5, CONTENT_WIDTH, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    let x = MARGIN_X;
    spec.headers.forEach((h, i) => {
      pdf.text(h, x + 1, y);
      x += spec.colWidths[i] ?? 0;
    });
    y += ROW_HEIGHT;
  };

  drawHeader();
  pdf.setFont('helvetica', 'normal');

  for (const row of spec.rows) {
    if (y > PAGE_BOTTOM) {
      pdf.addPage();
      y = 20;
      drawHeader();
      pdf.setFont('helvetica', 'normal');
    }
    let x = MARGIN_X;
    pdf.setFontSize(8);
    row.forEach((cell, i) => {
      const width = spec.colWidths[i] ?? 20;
      pdf.text(fitCell(pdf, cell, width - 2), x + 1, y);
      x += width;
    });
    pdf.setDrawColor(225, 225, 225);
    pdf.line(MARGIN_X, y + 2, MARGIN_X + CONTENT_WIDTH, y + 2);
    y += ROW_HEIGHT;
  }

  return y + 8;
}

export interface RegistrePdfInput {
  restaurantNom: string;
  mois: string;
  receptions: ReceptionRegistre[];
  etiquettes: EtiquetteRegistre[];
}

/**
 * Génère et télécharge le registre DDPP mensuel : réceptions fournisseurs
 * + étiquettes DLC du mois, compilées depuis les collections immutables.
 * Pagination manuelle (l'en-tête de tableau est répété à chaque page).
 */
export function generateRegistrePdf(input: RegistrePdfInput): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const moisLabel = formatMoisFr(input.mois);

  // En-tête document
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Registre HACCP — traçabilité', MARGIN_X, 20);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${input.restaurantNom} — ${moisLabel}`, MARGIN_X, 28);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Généré le ${formatTsFrDate(new Date())}`, MARGIN_X, 34);
  pdf.setTextColor(0, 0, 0);

  let y = 46;

  y = drawSection(pdf, y, {
    title: `Réceptions fournisseurs (${input.receptions.length})`,
    headers: ['Date', 'Produit', 'Fournisseur', 'Lot', 'Qté', 'DLC', 'Par'],
    colWidths: [18, 50, 30, 26, 18, 20, 20],
    rows: input.receptions.map((r) => [
      formatTsFr(r.createdAt),
      r.produit,
      r.fournisseur ?? '—',
      r.lot ?? '—',
      r.qte ?? '—',
      r.dlc ? formatDateFr(r.dlc) : '—',
      r.createdBy,
    ]),
    emptyMessage: 'Aucune réception enregistrée ce mois-ci.',
  });

  if (y > PAGE_BOTTOM - 30) {
    pdf.addPage();
    y = 20;
  }

  drawSection(pdf, y, {
    title: `Étiquettes DLC générées (${input.etiquettes.length})`,
    headers: ['Date', 'Produit', 'Préparé le', 'DLC', 'Qté', 'Par'],
    colWidths: [18, 60, 26, 26, 16, 36],
    rows: input.etiquettes.map((e) => [
      formatTsFr(e.createdAt),
      e.produit,
      formatDateFr(e.prodDate),
      formatDateFr(e.dlc),
      String(e.qte),
      e.createdBy,
    ]),
    emptyMessage: 'Aucune étiquette générée ce mois-ci.',
  });

  // Pied de page sur toutes les pages
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Document généré par PMS Midi 5 — données sources immutables (HACCP)', MARGIN_X, 291);
    pdf.text(`Page ${i}/${pageCount}`, PAGE_WIDTH - MARGIN_X, 291, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(`registre-ddpp-${input.mois}.pdf`);
}

function formatTsFrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
