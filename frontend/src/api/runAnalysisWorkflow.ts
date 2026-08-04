/**
 * Workflow d'analyse de site — nouveau backend NestJS.
 *
 * Enchaîne `POST /api/analyses` puis poll `GET /api/analyses/:id`
 * jusqu'à `status: done | failed`.
 *
 * Remplace `runSiteAnalysisWorkflow.ts` (ancien backend).
 */

import { apiErrorMessage } from '@lib/apiErrorMessage';
import { toUserFacingAnalysisError } from '@shared/lib/analysisErrorMessage';
import { sleep } from '@shared/lib/sleep';

import type { Analysis } from '@types-api';

import { createAnalysis, getAnalysis } from './analysis';

const POLL_INTERVAL_MS = 800;

export type RunAnalysisResult =
  | { ok: true; analysis: Analysis }
  | { ok: false; error: string; partial?: Analysis };

/**
 * Lance l'analyse puis attend qu'elle soit terminée (`done` ou `failed`).
 *
 * @param urlInput  - URL du site à analyser.
 * @param options.onProgress  - Callback appelé à chaque mise à jour de statut.
 */
export async function runAnalysisWorkflow(
  urlInput: string,
  options?: { onProgress?: (a: Analysis) => void },
): Promise<RunAnalysisResult> {
  const raw = urlInput.trim();
  if (!raw) return { ok: false, error: 'URL vide.' };

  let current: Analysis;

  try {
    current = await createAnalysis(raw);
  } catch (e) {
    return {
      ok: false,
      error: apiErrorMessage(e, "Impossible de lancer l'analyse."),
    };
  }

  options?.onProgress?.(current);

  try {
    while (current.status !== 'done' && current.status !== 'failed') {
      await sleep(POLL_INTERVAL_MS);
      current = await getAnalysis(current.id);
      options?.onProgress?.(withUserFacingError(current));
    }
  } catch (e) {
    return {
      ok: false,
      error: apiErrorMessage(e, "Erreur lors du suivi de l'analyse."),
      partial: withUserFacingError(current),
    };
  }

  if (current.status === 'failed') {
    const failed = withUserFacingError(current);
    const message =
      typeof failed.errorMessage === 'string' && failed.errorMessage.trim()
        ? failed.errorMessage
        : toUserFacingAnalysisError(failed.errorCode, null);
    return { ok: false, error: message, partial: failed };
  }

  return { ok: true, analysis: current };
}

function withUserFacingError(analysis: Analysis): Analysis {
  if (analysis.status !== 'failed') return analysis;
  return {
    ...analysis,
    errorMessage: toUserFacingAnalysisError(analysis.errorCode, analysis.errorMessage),
  };
}
