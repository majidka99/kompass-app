import React from 'react';
import type { HelpResource } from '../data/helpResources';
import BackButton from '../components/ui/BackButton';
import { useTranslation } from 'react-i18next';
import FailsafeWrapper from '../components/FailsafeWrapper';

interface NotfallProps {
  helpResources: HelpResource[];
}

export default function Notfall({ helpResources }: NotfallProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <FailsafeWrapper>
      <div className="card notfall-card">
        <BackButton />
        <h2>{t('emergency.title')}</h2>
        <div className="contact-list">
          <a href="tel:116111" style={{ color: '#abebc6' }}>
            {t('emergency.youthHotline')}
          </a>
          <a href="tel:08001110111" style={{ color: '#abebc6' }}>
            {t('emergency.crisisHotline')}
          </a>
          <a href="tel:112" style={{ color: '#abebc6' }}>
            {t('emergency.emergencyNumber')}
          </a>
        </div>
        <div
          style={{
            margin: '18px 0 10px 0',
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          {t('emergency.websitesHelp')}
        </div>
        <ul>
          {helpResources.map(h => (
            <li key={h.url}>
              <a
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#abebc6' }}
              >
                {t(h.nameKey) || h.name}
              </a>
            </li>
          ))}
        </ul>
        <div className="invite-friends">
          <p>
            {t('emergency.inviteFriends')}
            <input
              readOnly
              value={window.location.href}
              onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
              style={{ width: '80%' }}
            />{' '}
            <button onClick={() => void navigator.clipboard.writeText(window.location.href)}>
              📋
            </button>
          </p>
        </div>
      </div>
    </FailsafeWrapper>
  );
}
