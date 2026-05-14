/**
 * Retourne les initiales d'un cuisinier en 2 caractères majuscules (ex: "Marc Dupont" → "MD").
 */
export function getInitials(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}
