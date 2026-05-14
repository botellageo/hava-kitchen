import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { translateAuthError } from '@/lib/firebaseAuthErrors';
import { AppLogo } from '@/components/ui/AppLogo';
import { SetupStepAccount } from '@/components/setup/SetupStepAccount';
import { SetupStepResto } from '@/components/setup/SetupStepResto';
import { SetupStepPin } from '@/components/setup/SetupStepPin';

type Step = 'account' | 'resto' | 'pin';

export default function SignupPage() {
  const { user, signUp } = useAuth();
  const { createRestaurant } = useRestaurant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Si déjà connecté (ex: refresh page après création), rediriger.
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface shadow-card w-full max-w-lg rounded-2xl p-8 md:p-12">
        <div className="mb-2">
          <AppLogo />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className={step === 'account' ? 'text-brand-darker font-semibold' : ''}>
            1. Compte
          </span>
          <span>→</span>
          <span className={step === 'resto' ? 'text-brand-darker font-semibold' : ''}>
            2. Restaurant
          </span>
          <span>→</span>
          <span className={step === 'pin' ? 'text-brand-darker font-semibold' : ''}>
            3. PIN gérant
          </span>
        </div>

        {step === 'account' && (
          <>
            <SetupStepAccount
              initialEmail={email}
              onNext={({ email: e, password: p }) => {
                setEmail(e);
                setPassword(p);
                setStep('resto');
              }}
            />
            <p className="mt-6 text-center text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-brand-darker font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </>
        )}

        {step === 'resto' && (
          <SetupStepResto
            initialNom={nom}
            initialAdresse={adresse}
            userEmail={email}
            onNext={({ nom: n, adresse: a }) => {
              setNom(n);
              setAdresse(a);
              setStep('pin');
            }}
            onSignOut={() => setStep('account')}
          />
        )}

        {step === 'pin' && (
          <>
            <SetupStepPin
              onBack={() => setStep('resto')}
              onSubmit={async (pin) => {
                setError(null);
                try {
                  // 1. Créer le compte Firebase Auth (auto-connecté via onAuthStateChanged)
                  await signUp(email, password);
                  // 2. Créer le restaurant avec ownerUid = nouveau user.uid
                  await createRestaurant({
                    nom,
                    ...(adresse ? { adresse } : {}),
                    managerPin: pin,
                  });
                  showToast({
                    kind: 'success',
                    message: `Bienvenue ! Compte créé pour ${nom}.`,
                  });
                  navigate('/admin', { replace: true });
                } catch (err) {
                  if (err instanceof FirebaseError) {
                    throw new Error(translateAuthError(err.code), { cause: err });
                  }
                  throw err;
                }
              }}
            />
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
