import { useEffect } from 'react';

type AnalyzeSuccessModalProps = {
  open: boolean;
  url: string | null;
  onClose: () => void;
};

export function AnalyzeSuccessModal({ open, url, onClose }: AnalyzeSuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !url) return null;

  return (
    <div className="analyze-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="analyze-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analyze-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="analyze-success-title" className="analyze-modal-title">
          <span className="highlight">Analyse</span> lancée
        </h2>
        <p className="analyze-modal-sub">Connexion et API à brancher ensuite. URL retenue&nbsp;:</p>
        <p className="analyze-modal-url" title={url}>
          {url}
        </p>
        <button type="button" className="analyze-modal-close" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
