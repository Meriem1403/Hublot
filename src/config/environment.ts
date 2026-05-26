/**
 * Identification de l'environnement d'exécution (DEV, TEST local, staging, preview, PROD).
 * La valeur est injectée au build via VITE_APP_ENV (netlify.toml, fichiers .env.*).
 */
export type AppEnvironment =
  | 'development'
  | 'test'
  | 'staging'
  | 'preview'
  | 'production';

const LABELS: Record<AppEnvironment, string> = {
  development: 'Développement (DEV)',
  test: 'Test local (QA)',
  staging: 'Préproduction (STAGING)',
  preview: 'Aperçu PR (PREVIEW)',
  production: 'Production',
};

export function getAppEnvironment(): AppEnvironment {
  const raw = String(import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development').trim();
  if (raw === 'production' || raw === 'staging' || raw === 'preview' || raw === 'test' || raw === 'development') {
    return raw;
  }
  return import.meta.env.PROD ? 'production' : 'development';
}

export function getEnvironmentLabel(): string {
  return LABELS[getAppEnvironment()];
}

export function isProductionEnvironment(): boolean {
  return getAppEnvironment() === 'production';
}

export function shouldShowEnvironmentBadge(): boolean {
  return !isProductionEnvironment();
}
