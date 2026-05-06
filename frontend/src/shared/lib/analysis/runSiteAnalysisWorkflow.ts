import { getSiteAnalysis, postSiteAnalysis, type SiteAnalysis } from './analysisApi';

const POLL_MS = 800;

type SiteAnalysisSummary = {
  id: string;
  url: string;
  cms?: string;
  verticalSummary?: string;
  catalogMatchCategories?: string[];
  mainBrands?: string[];
};

export function mapSiteAnalysisToSummary(a: SiteAnalysis): SiteAnalysisSummary {
  const catalogMatchCategories =
    a.catalogMatchCategories && a.catalogMatchCategories.length > 0
      ? a.catalogMatchCategories
      : undefined;
  return {
    id: a.id,
    url: a.url,
    cms: a.cmsType,
    verticalSummary: a.verticalSummary,
    catalogMatchCategories,
    mainBrands: a.brandsList,
  };
}

export type RunSiteAnalysisWorkflowResult =
  | { ok: true; summary: SiteAnalysisSummary }
  | { ok: false; error: string; partial?: SiteAnalysis };

/**
 * Enchaîne `POST` puis attente active jusqu'à statut `completed` ou `failed`.
 */
export async function runSiteAnalysisWorkflow(
  urlInput: string,
  options?: { onProgress?: (a: SiteAnalysis) => void },
): Promise<RunSiteAnalysisWorkflowResult> {
  const raw = urlInput.trim();
  if (!raw) return { ok: false, error: 'URL vide.' };

  let created: SiteAnalysis;
  try {
    created = await postSiteAnalysis(raw);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Impossible de lancer l'analyse.",
    };
  }

  options?.onProgress?.(created);

  let latest = created;

  try {
    while (latest.status !== 'completed' && latest.status !== 'failed') {
      await new Promise<void>((resolve) => setTimeout(resolve, POLL_MS));
      latest = await getSiteAnalysis(latest.id);
      options?.onProgress?.({ ...latest });
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du suivi de l'analyse.",
      partial: latest,
    };
  }

  if (latest.status === 'failed') {
    return {
      ok: false,
      error:
        typeof latest.errorMessage === 'string' && latest.errorMessage.trim()
          ? latest.errorMessage
          : 'Analyse terminée avec erreur.',
      partial: latest,
    };
  }

  return { ok: true, summary: mapSiteAnalysisToSummary(latest) };
}
