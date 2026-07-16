/**
 * Convertit une date ISO YYYY-MM-DD en format français DD/MM/YYYY.
 * Retourne la chaîne brute si format inattendu.
 */
export function formatDateFr(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}
