import { CircleCheck, CircleX } from 'lucide-react';

import type { components } from '../../../generated/api';

type SiteAnalysis = components['schemas']['SiteAnalysis'];

const STEPS = [
  'Connexion au site',
  'Détection du CMS',
  'Référencement des marques',
  'Analyse des produits',
  'Extraction des catégories',
  'Finalisation',
] as const;

type AnalysisProgressProps = {
  analysis: SiteAnalysis;
  onDismiss?: () => void;
};

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
              <CircleX
                className="analysis-progress-icon-svg"
                size={36}
                strokeWidth={2}
                aria-hidden
              />
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
                    <CircleCheck
                      className="analysis-progress-circle-icon"
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : isFailedStep ? (
                    <CircleX
                      className="analysis-progress-circle-icon"
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden
                    />
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
