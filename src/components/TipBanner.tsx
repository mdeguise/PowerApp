import { useState } from 'react';
import { LightbulbIcon } from './icons';

export function TipBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="tip-banner">
      <div className="tip-banner__left">
        <LightbulbIcon className="tip-banner__icon" />
        <span>
          <strong>Conseil :</strong> Vous pouvez enregistrer votre demande en tout temps et y revenir plus tard.
        </span>
      </div>
      <button type="button" className="tip-banner__close" onClick={() => setVisible(false)} aria-label="Fermer">
        ✕
      </button>
    </div>
  );
}
