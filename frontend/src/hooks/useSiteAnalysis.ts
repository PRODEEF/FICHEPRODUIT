import { useCallback, useState } from 'react'
import type { SiteAnalysis } from '../lib/analysisApi'
import { runSiteAnalysisWorkflow } from '../lib/runSiteAnalysisWorkflow'
import type { SiteAnalysisSummary } from '../types/siteAnalysis'

export type RunAnalysisOutcome =
  | 'success'
  | 'error_alert'
  | 'error_modal'

type UseSiteAnalysisOptions = {
  onSuccess?: (summary: SiteAnalysisSummary) => void
}

export function useSiteAnalysis(options: UseSiteAnalysisOptions = {}) {
  const { onSuccess } = options
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null)

  const runAnalysis = useCallback(
    async (urlInput: string): Promise<RunAnalysisOutcome> => {
      const result = await runSiteAnalysisWorkflow(urlInput, {
        onProgress: (a) => {
          setAnalysisOpen(true)
          setSiteAnalysis(a)
        },
      })

      if (!result.ok) {
        if (!result.partial) {
          window.alert(result.error)
          setAnalysisOpen(false)
          setSiteAnalysis(null)
          return 'error_alert'
        }

        setAnalysisOpen(true)
        const p = result.partial
        if (p.status === 'failed') {
          setSiteAnalysis(p)
        } else {
          setSiteAnalysis({
            ...p,
            status: 'failed',
            errorMessage: result.error,
          })
        }
        return 'error_modal'
      }

      const summary = result.summary
      onSuccess?.(summary)
      setAnalysisOpen(false)
      setSiteAnalysis(null)
      return 'success'
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
