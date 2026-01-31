import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // ✅

export default function NotFound(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '72px', marginBottom: '20px' }}>🧭</div>
      <h2>{t('errors.pageNotFound')}</h2>
      <p style={{ marginBottom: '30px', color: '#d0d0d0' }}>{t('errors.pageNotFoundMessage')}</p>
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => void navigate('/')}
          style={{
            background: '#abebc6',
            color: '#2f4f4f',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {t('buttons.home')}
        </button>
        <button
          onClick={() => void navigate(-1)}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {t('buttons.back')}
        </button>
      </div>
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#888' }}>
        <p>{t('errors.navigationHint')}</p>
      </div>
    </div>
  );
}
