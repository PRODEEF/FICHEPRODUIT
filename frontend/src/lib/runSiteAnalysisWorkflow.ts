import {
  getSiteAnalysis,
  postSiteAnalysis,
  type SiteAnalysis,
} from './analysisApi'
import { sleep } from './sleep'
import type { SiteAnalysisSummary } from '../types/siteAnalysis'

const POLL_MS = 800

export function mapSiteAnalysisToSummary(a: SiteAnalysis): SiteAnalysisSummary {
  const catalogMatchCategories =
    a.catalogMatchCategories && a.catalogMatchCategories.length > 0
      ? a.catalogMatchCategories
      : undefined
  return {
    id: a.id,
    url: a.url,
    cms: a.cmsType,
    verticalSummary: a.verticalSummary,
    catalogMatchCategories,
    mainBrands: a.brandsList,
  }
}

export type RunSiteAnalysisWorkflowResult =
  | { ok: true; summary: SiteAnalysisSummary }
  | { ok: false; error: string; partial?: SiteAnalysis }

/**
 * POST then poll until completed / failed. Used by the analysis hook and post-signup flow.
 */
export async function runSiteAnalysisWorkflow(
  urlInput: string,
  options?: { onProgress?: (a: SiteAnalysis) => void },
): Promise<RunSiteAnalysisWorkflowResult> {
  const raw = urlInput.trim()
  if (!raw) return { ok: false, error: 'URL vide.' }

  let created: SiteAnalysis
  try {
    created = await postSiteAnalysis(raw)
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : 'Impossible de lancer l’analyse.',
    }
  }

  options?.onProgress?.(created)

  let latest = created

  try {
    while (latest.status !== 'completed' && latest.status !== 'failed') {
      await sleep(POLL_MS)
      latest = await getSiteAnalysis(latest.id)
      options?.onProgress?.({ ...latest })
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Erreur lors du suivi de l’analyse.'
    return {
      ok: false,
      error: message,
      partial: latest,
    }
  }

  if (latest.status === 'failed') {
    return {
      ok: false,
      error:
        typeof latest.errorMessage === 'string' && latest.errorMessage.trim()
          ? latest.errorMessage
          : 'Analyse terminée avec erreur.',
      partial: latest,
    }
  }

  return { ok: true, summary: mapSiteAnalysisToSummary(latest) }
}
