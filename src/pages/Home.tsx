import { env } from '@/lib/env';

export function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">PMS Midi 5</h1>
        <p className="text-gray-600 mb-6">
          Plan de Maîtrise Sanitaire — Squelette initialisé avec garde-fous solo dev.
        </p>
        <div className="text-left text-sm text-gray-700 space-y-2 bg-gray-50 p-4 rounded">
          <div>
            <span className="font-medium">Projet Firebase :</span>{' '}
            <code className="bg-white px-1 rounded">
              {env.VITE_FIREBASE_PROJECT_ID || '(non configuré)'}
            </code>
          </div>
          <div>
            <span className="font-medium">Mode :</span>{' '}
            {env.USE_EMULATOR ? (
              <span className="text-orange-600 font-medium">🔧 Emulator local</span>
            ) : (
              <span className="text-green-600 font-medium">🌐 Firebase prod</span>
            )}
          </div>
          <div>
            <span className="font-medium">Sentry :</span>{' '}
            {env.VITE_SENTRY_DSN ? '✅ actif' : '⚪ désactivé'}
          </div>
        </div>
      </div>
    </main>
  );
}
