import { getAppEnvironment, getEnvironmentLabel } from '../config/environment';

const STYLES: Record<string, { bg: string; text: string }> = {
  development: { bg: '#1e40af', text: '#dbeafe' },
  test: { bg: '#7c3aed', text: '#ede9fe' },
  staging: { bg: '#b45309', text: '#ffedd5' },
  preview: { bg: '#0f766e', text: '#ccfbf1' },
};

export function EnvironmentBadge() {
  const env = getAppEnvironment();
  const colors = STYLES[env] ?? STYLES.development;

  return (
    <div
      role="status"
      aria-label={`Environnement : ${getEnvironmentLabel()}`}
      style={{
        background: colors.bg,
        color: colors.text,
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {getEnvironmentLabel()}
    </div>
  );
}
