/**
 * Traduit un code d'erreur Firebase Auth en message lisible en français.
 * Cible : gérant non technique (JB), pas de stack trace ni jargon.
 */
export function translateAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/user-disabled':
      return 'Ce compte est désactivé.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessaie dans quelques minutes.';
    case 'auth/network-request-failed':
      return 'Pas de connexion internet.';
    case 'auth/email-already-in-use':
      return 'Cet email a déjà un compte. Connecte-toi à la place.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible (minimum 6 caractères).';
    case 'auth/operation-not-allowed':
      return "L'inscription par email n'est pas activée. Contacte l'admin.";
    default:
      return 'Opération impossible. Réessaie.';
  }
}
