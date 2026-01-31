import type { JSX } from 'react';
import { useTranslation } from 'react-i18next'; // ✅

type LoadingProps = {
  message?: string;
};
export default function Loading({ message }: LoadingProps): JSX.Element {
  const { t } = useTranslation();

  // Fallback to English if no context available
  const loadingMessage = message || t('loading.default') || 'Loading...';
  const subtitleMessage = t('loading.subtitle') || 'Just a moment please...';
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div className="loading-spinner">🧭</div>
      <h3 style={{ margin: '0 0 10px 0', color: '#ffffff' }}>{loadingMessage}</h3>
      <p style={{ margin: '0', color: '#d0d0d0', fontSize: '14px' }}>{subtitleMessage}</p>
    </div>
  );
}
