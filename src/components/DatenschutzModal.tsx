import type { JSX } from 'react';
import { useTranslation } from 'react-i18next'; // ✅

type DatenschutzModalProps = {
  onClose: () => void;
  dsHinweis: string;
};

export default function DatenschutzModal({
  onClose,
  dsHinweis,
}: DatenschutzModalProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="ds-modal">
      <div className="ds-box">
        <p>{dsHinweis}</p>
        <button onClick={onClose}>{t('buttons.ok')}</button>
      </div>
    </div>
  );
}
