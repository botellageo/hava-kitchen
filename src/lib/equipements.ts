import type { Equipement } from '@/lib/schemas';

/** Payload de création/modification d'un équipement (côté formulaire). */
export interface EquipementInput {
  nom: string;
  type: Equipement['type'];
  seuilMin: number;
  seuilMax: number;
  sondeId?: string;
}

/** Équipements de démonstration (identiques à la maquette PMS_04). */
export const DEMO_EQUIPEMENTS: EquipementInput[] = [
  { nom: 'Frigo positif 1', type: 'frigo', seuilMin: 0, seuilMax: 6, sondeId: '0xA1B2' },
  { nom: 'Frigo positif 2', type: 'frigo', seuilMin: 0, seuilMax: 6, sondeId: '0xA1B3' },
  { nom: 'Congélateur', type: 'congelateur', seuilMin: -22, seuilMax: -18, sondeId: '0xA1B4' },
];

/** Valide et normalise un EquipementInput avant écriture Firestore. Throw si invalide. */
export function validateEquipementInput(input: EquipementInput): EquipementInput {
  const nom = input.nom.trim();
  if (!nom) throw new Error("Nom de l'équipement requis");
  if (!Number.isFinite(input.seuilMin) || !Number.isFinite(input.seuilMax)) {
    throw new Error('Seuils invalides');
  }
  if (input.seuilMin >= input.seuilMax) {
    throw new Error('Le seuil min doit être inférieur au seuil max');
  }
  const sondeId = input.sondeId?.trim();
  return { ...input, nom, ...(sondeId ? { sondeId } : {}) };
}
