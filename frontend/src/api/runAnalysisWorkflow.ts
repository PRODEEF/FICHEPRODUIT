/**
 * Workflow d'analyse de site — nouveau backend NestJS.
 *
 * Enchaîne `POST /api/analyses` puis poll `GET /api/analyses/:id`
 * jusqu'à `status: done | failed`.
 *
 * Remplace `runSiteAnalysisWorkflow.ts` (ancien backend).
 */

import { sleep } from '@shared/lib/sleep';

import type { Analysis } from './types/api.types';
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
      error: e instanceof Error ? e.message : "Impossible de lancer l'analyse.",
    };
  }

  options?.onProgress?.(current);

  try {
    while (current.status !== 'done' && current.status !== 'failed') {
      await sleep(POLL_INTERVAL_MS);
      current = await getAnalysis(current.id, current.sessionId);
      options?.onProgress?.({ ...current });
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du suivi de l'analyse.",
      partial: current,
    };
  }

  if (current.status === 'failed') {
    const message =
      typeof current.errorMessage === 'string' && current.errorMessage.trim()
        ? current.errorMessage
        : errorCodeToMessage(current.errorCode);
    return { ok: false, error: message, partial: current };
  }

  return { ok: true, analysis: current };
}

function errorCodeToMessage(code: Analysis['errorCode']): string {
  switch (code) {
    case 'SITE_UNREACHABLE':
      return 'Le site est inaccessible ou introuvable.';
    case 'UNANALYZABLE':
      return "Le site n'a pas pu être analysé (structure non reconnue).";
    case 'INTERNAL_ERROR':
    default:
      return 'Analyse terminée avec erreur inconnue.';
  }
}
