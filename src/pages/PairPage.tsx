import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { httpsCallable, type FunctionsError } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase';
import { useCuisinierSession } from '@/hooks/useCuisinierSession';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { tryParseDoc } from '@/lib/firestore';
import { cuisinierSchema } from '@/lib/schemas';

type Status = 'pending' | 'success' | 'error';

interface RedeemPairingTokenResult {
  customToken: string;
}

export default function PairPage() {
  const [params] = useSearchParams();
  const { setCuisinier } = useCuisinierSession();
  const [status, setStatus] = useState<Status>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);

  const rid = params.get('rid');
  const tokenId = params.get('token');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    // Effet de pairing déclenché une seule fois au mount (guard via ran).
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!rid || !tokenId) {
      setErrorMessage('Lien de pairing invalide.');
      setStatus('error');
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    void (async () => {
      let customTokenSigned = false;
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }

        const redeem = httpsCallable<
          { restaurantId: string; tokenId: string },
          RedeemPairingTokenResult
        >(functions, 'redeemPairingToken');
        const result = await redeem({ restaurantId: rid, tokenId });

        const { user } = await signInWithCustomToken(auth, result.data.customToken);
        customTokenSigned = true;

        const tokenResult = await user.getIdTokenResult(true);
        const cuisinierId = tokenResult.claims['cuisinierId'];
        if (typeof cuisinierId !== 'string') {
          throw new Error('Custom token sans cuisinierId');
        }
        const cuisinierRef = doc(collection(db, 'restaurants', rid, 'cuisiniers'), cuisinierId);
        const snap = await getDoc(cuisinierRef);
        const parsed = tryParseDoc(snap, cuisinierSchema);
        if (!parsed) {
          throw new Error('Profil cuisinier introuvable');
        }

        setCuisinier({ id: parsed.id, prenom: parsed.prenom, nom: parsed.nom });
        setStatus('success');
      } catch (err) {
        // Rollback : si on s'était authentifié avec le custom token mais que la
        // suite a échoué (getDoc cuisinier, etc.), on déconnecte pour éviter un
        // état Firebase Auth incohérent avec la session app (cuisinier déconnecté).
        if (customTokenSigned && auth.currentUser) {
          try {
            await auth.signOut();
          } catch {
            // best effort
          }
        }
        const fnErr = err as FunctionsError;
        const message =
          fnErr.code === 'functions/deadline-exceeded'
            ? "Le code QR a expiré. Demande au gérant d'en regénérer un."
            : fnErr.code === 'functions/failed-precondition'
              ? 'Ce code QR a déjà été utilisé.'
              : fnErr.code === 'functions/not-found'
                ? 'Code QR inconnu.'
                : (fnErr.message ?? 'Connexion impossible.');
        setErrorMessage(message);
        setStatus('error');
      }
    })();
  }, [rid, tokenId, setCuisinier]);

  if (status === 'success') {
    return <Navigate to="/cuisine/home" replace />;
  }

  return (
    <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface shadow-card w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="from-brand to-brand-dark flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-base font-bold text-white">
            M5
          </div>
        </div>
        {status === 'pending' && (
          <>
            <h1 className="text-brand-darker mb-2 text-lg font-bold">Connexion en cours…</h1>
            <p className="text-sm text-gray-500">On valide le code QR et on te connecte à l'app.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="mb-2 text-lg font-bold text-red-700">Connexion impossible</h1>
            <p className="text-sm text-gray-600">{errorMessage}</p>
            <p className="mt-4 text-xs text-gray-400">
              Demande au gérant d'ouvrir l'écran cuisine et de te montrer un nouveau code QR.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
