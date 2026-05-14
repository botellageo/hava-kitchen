import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/useToast';
import { AppLogo } from '@/components/ui/AppLogo';
import { SetupStepResto } from '@/components/setup/SetupStepResto';
import { SetupStepPin } from '@/components/setup/SetupStepPin';

type Step = 'resto' | 'pin';

export default function SetupRestaurantPage() {
  const { user, signOut } = useAuth();
  const { restaurant, loading, createRestaurant } = useRestaurant();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('resto');
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');

  if (!loading && restaurant) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="bg-surface-softer flex min-h-screen items-center justify-center p-4">
      <div className="bg-surface shadow-card w-full max-w-lg rounded-2xl p-8 md:p-12">
        <div className="mb-2">
          <AppLogo />
        </div>

        <div className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <span className={step === 'resto' ? 'text-brand-darker font-semibold' : ''}>
            1. Restaurant
          </span>
          <span>→</span>
          <span className={step === 'pin' ? 'text-brand-darker font-semibold' : ''}>
            2. PIN gérant
          </span>
        </div>

        {step === 'resto' && (
          <SetupStepResto
            initialNom={nom}
            initialAdresse={adresse}
            userEmail={user?.email}
            onNext={({ nom: n, adresse: a }) => {
              setNom(n);
              setAdresse(a);
              setStep('pin');
            }}
            onSignOut={() => void signOut()}
          />
        )}

        {step === 'pin' && (
          <SetupStepPin
            onBack={() => setStep('resto')}
            onSubmit={async (pin) => {
              await createRestaurant({
                nom,
                ...(adresse ? { adresse } : {}),
                managerPin: pin,
              });
              showToast({ kind: 'success', message: 'Restaurant créé.' });
              navigate('/admin', { replace: true });
            }}
          />
        )}
      </div>
    </div>
  );
}
