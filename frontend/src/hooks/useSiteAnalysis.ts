import { useCallback, useState } from 'react'
import {
  getSiteAnalysis,
  postSiteAnalysis,
  type SiteAnalysis,
} from '../lib/analysisApi'
import { sleep } from '../lib/sleep'
import type { SiteAnalysisSummary } from '../types/siteAnalysis'

const POLL_MS = 800

function mapToSummary(a: SiteAnalysis): SiteAnalysisSummary {
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

type UseSiteAnalysisOptions = {
  onSuccess?: (summary: SiteAnalysisSummary) => void
}

export function useSiteAnalysis(options: UseSiteAnalysisOptions = {}) {
  const { onSuccess } = options
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null)

  const runAnalysis = useCallback(
    async (urlInput: string) => {
      const raw = urlInput.trim()
      if (!raw) return

      let created: SiteAnalysis
      try {
        created = await postSiteAnalysis(raw)
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : 'Impossible de lancer l’analyse.',
        )
        return
      }

      setAnalysisOpen(true)
      setSiteAnalysis(created)

      let latest = created
      try {
        while (latest.status !== 'completed' && latest.status !== 'failed') {
          await sleep(POLL_MS)
          latest = await getSiteAnalysis(latest.id)
          setSiteAnalysis({ ...latest })
        }
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Erreur lors du suivi de l’analyse.'
        setSiteAnalysis((prev) =>
          prev
            ? {
              ...prev,
              status: 'failed',
              errorMessage: message,
            }
            : prev,
        )
        return
      }

      if (latest.status === 'failed') {
        return
      }

      const summary = mapToSummary(latest)
      onSuccess?.(summary)
      setAnalysisOpen(false)
      setSiteAnalysis(null)
    },
    [onSuccess],
  )

  const dismissError = useCallback(() => {
    setAnalysisOpen(false)
    setSiteAnalysis(null)
  }, [])

  return {
    runAnalysis,
    analysisOpen,
    siteAnalysis,
    dismissError,
  }
}
