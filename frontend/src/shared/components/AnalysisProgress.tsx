import { CircleCheck, CircleX } from 'lucide-react';

import { Button, Modal } from '@shared/ui';
import type { Analysis } from '@types-api';

const STEPS = [
  'Connexion au site',
  'Détection du CMS',
  'Référencement des marques',
  'Analyse des produits',
  'Extraction des catégories',
  'Finalisation',
] as const;

interface AnalysisProgressProps {
  analysis: Analysis & { currentStep?: number };
  onDismiss?: () => void;
}

function clampStep(step: number): number {
  return Math.min(Math.max(step, 1), STEPS.length);
}

function deriveStepFromStatus(status: Analysis['status']): number {
  switch (status) {
    case 'pending':
      return 1;
    case 'running':
      return Math.max(1, Math.floor(STEPS.length / 2));
    case 'done':
      return STEPS.length;
    case 'failed':
    default:
      return 1;
  }
}

export function AnalysisProgress({ analysis, onDismiss }: AnalysisProgressProps) {
  const { status, url, errorMessage } = analysis;
  const currentStep = clampStep(analysis.currentStep ?? deriveStepFromStatus(status));
  const isFailed = status === 'failed';
  const isDone = status === 'done';

  return (
    <Modal
      open
      title="Progression de l’analyse"
      onClose={onDismiss ?? (() => undefined)}
      className="z-[210]"
    >
      <div aria-labelledby="analysis-progress-title" aria-busy={!isFailed}>
        <div className="mb-2 flex justify-center">
          {isFailed ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <CircleX className="h-9 w-9" size={36} strokeWidth={2} aria-hidden />
            </div>
          ) : isDone ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CircleCheck className="h-9 w-9" size={36} strokeWidth={2} aria-hidden />
            </div>
          ) : (
            <div
              className="h-14 w-14 animate-spin rounded-full border-3 border-soft border-t-purple-600"
              aria-hidden
            />
          )}
        </div>

        <h2
          id="analysis-progress-title"
          className="mb-3 text-center text-3xl font-black leading-tight"
        >
          {isFailed ? (
            <>Erreur lors de l&apos;analyse</>
          ) : isDone ? (
            <>Analyse terminée</>
          ) : (
            <>
              <span className="bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                Analyse
              </span>{' '}
              en cours…
            </>
          )}
        </h2>

        <p
          className="mb-4 max-h-[4.5rem] overflow-auto rounded-xl border border-border-purple bg-purple-50 px-4 py-3 text-center text-sm text-purple-600"
          title={url}
        >
          {url}
        </p>

        {isFailed && errorMessage ? (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <ol className="mb-5 flex list-none flex-col gap-2 p-0">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = isDone || currentStep > stepNumber;
            const isCurrent = currentStep === stepNumber && !isFailed;
            const isFailedStep = isFailed && currentStep === stepNumber;

            const circleClass = isCompleted
              ? 'bg-green-500 text-white'
              : isCurrent
                ? 'bg-purple-600 text-white'
                : isFailedStep
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-400';
            const labelClass = isCompleted
              ? 'font-semibold text-green-600'
              : isCurrent
                ? 'font-semibold text-purple-700'
                : isFailedStep
                  ? 'font-semibold text-red-600'
                  : 'text-gray-400';

            return (
              <li key={stepNumber} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${circleClass}`}
                >
                  {isCompleted ? (
                    <CircleCheck
                      className="h-[1.1rem] w-[1.1rem]"
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : isFailedStep ? (
                    <CircleX
                      className="h-[1.1rem] w-[1.1rem]"
                      size={18}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span className={`text-sm ${labelClass}`}>
                  {label}
                  {isCurrent ? '…' : ''}
                </span>
              </li>
            );
          })}
        </ol>

        {(isFailed || isDone) && onDismiss ? (
          <Button type="button" variant="gradient" className="mt-2 w-full" onClick={onDismiss}>
            Fermer
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
