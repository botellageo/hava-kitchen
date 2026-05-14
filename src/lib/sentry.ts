import * as Sentry from '@sentry/react';
import { env } from './env';

export function initSentry(): void {
  if (!env.VITE_SENTRY_DSN) {
    if (env.IS_PROD) {
      console.warn('⚠️ Sentry désactivé en prod (VITE_SENTRY_DSN vide)');
    }
    return;
  }

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.IS_PROD ? 'production' : 'development',
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: env.IS_PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
