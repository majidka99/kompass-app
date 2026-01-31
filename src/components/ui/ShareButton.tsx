import type { JSX } from 'react';

type ShareButtonProps = {
  onClick: () => void;
  ariaLabel: string;
};

export default function ShareButton({
  onClick,
  ariaLabel = 'Teilen',
}: ShareButtonProps): JSX.Element {
  return (
    <button onClick={onClick} className="share-btn" aria-label={ariaLabel}>
      Teilen
    </button>
  );
}
