/**
 * Monitoring erreurs front (Sentry) — activé uniquement si VITE_SENTRY_DSN est défini.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.trim()) {
    return;
  }

  const environment =
    import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development';

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: dsn.trim(),
      environment,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      sendDefaultPii: false,
    });
  } catch (err) {
    console.warn('[monitoring] Sentry non initialisé:', err);
  }
}
