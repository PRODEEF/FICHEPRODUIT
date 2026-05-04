import type { components } from '../../generated/api';

type SiteAnalysis = components['schemas']['SiteAnalysis'];

const STEPS = [
  'Résolution du site',
  'Connexion au site',
  'Détection du CMS',
  'Analyse du catalogue',
  'Extraction des catégories',
  'Finalisation',
] as const;

type AnalysisProgressProps = {
  analysis: SiteAnalysis;
  onDismiss?: () => void;
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AnalysisProgress({ analysis, onDismiss }: AnalysisProgressProps) {
  const { currentStep, status, url, errorMessage } = analysis;
  const isFailed = status === 'failed';

  return (
    <div className="analyze-modal-backdrop analysis-progress-backdrop" role="presentation">
      <div
        className="analyze-modal-panel analysis-progress-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-progress-title"
        aria-busy={!isFailed}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="analysis-progress-icon-wrap">
          {isFailed ? (
            <div className="analysis-progress-icon analysis-progress-icon--error">
              <XIcon className="analysis-progress-icon-svg" />
            </div>
          ) : (
            <div className="analysis-progress-spinner" aria-hidden />
          )}
        </div>

        <h2 id="analysis-progress-title" className="analyze-modal-title">
          {isFailed ? (
            <>Erreur lors de l&apos;analyse</>
          ) : (
            <>
              <span className="highlight">Analyse</span> en cours…
            </>
          )}
        </h2>

        <p className="analyze-modal-url analysis-progress-url" title={url}>
          {url}
        </p>

        {isFailed && errorMessage ? (
          <div className="analysis-progress-error">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <ol className="analysis-progress-steps">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber && !isFailed;
            const isPending = currentStep < stepNumber;
            const isFailedStep = isFailed && currentStep === stepNumber;

            let circleClass = 'analysis-progress-circle';
            if (isCompleted) circleClass += ' analysis-progress-circle--done';
            else if (isCurrent) circleClass += ' analysis-progress-circle--active';
            else if (isFailedStep) circleClass += ' analysis-progress-circle--failed';
            else if (isPending) circleClass += ' analysis-progress-circle--pending';

            let labelClass = 'analysis-progress-label';
            if (isCompleted) labelClass += ' analysis-progress-label--done';
            else if (isCurrent) labelClass += ' analysis-progress-label--active';
            else if (isFailedStep) labelClass += ' analysis-progress-label--failed';
            else labelClass += ' analysis-progress-label--pending';

            return (
              <li key={stepNumber} className="analysis-progress-step">
                <span className={circleClass}>
                  {isCompleted ? (
                    <CheckIcon className="analysis-progress-circle-icon" />
                  ) : isFailedStep ? (
                    <XIcon className="analysis-progress-circle-icon" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span className={labelClass}>
                  {label}
                  {isCurrent ? '…' : ''}
                </span>
              </li>
            );
          })}
        </ol>

        {isFailed && onDismiss ? (
          <button
            type="button"
            className="analyze-modal-close analysis-progress-dismiss"
            onClick={onDismiss}
          >
            Fermer
          </button>
        ) : null}
      </div>
    </div>
  );
}
