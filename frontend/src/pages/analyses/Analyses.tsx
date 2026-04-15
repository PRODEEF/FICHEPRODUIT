import { useEffect, useLayoutEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { AnalyseResult } from '../../components/analysis/AnalyseResult'
import {
  getAnalysisProducts,
  getSiteAnalysis,
  type ProductListResponse,
  type SiteAnalysis,
} from '../../lib/analysisApi'
import {
  getAnalysisDetailCache,
  setAnalysisDetailCache,
} from '../../lib/analysisDetailCache'

export function Analyses() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [detailLoading, setDetailLoading] = useState(() => Boolean(analysisId))
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(() => {
    if (!user?.id || !analysisId) return null
    return getAnalysisDetailCache(user.id, analysisId)?.analysis ?? null
  })
  const [productPayload, setProductPayload] =
    useState<ProductListResponse | null>(() => {
      if (!user?.id || !analysisId) return null
      return getAnalysisDetailCache(user.id, analysisId)?.productPayload ?? null
    })
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      void navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useLayoutEffect(() => {
    if (!analysisId || !user?.id) return
    setDetailError(null)
    const cached = getAnalysisDetailCache(user.id, analysisId)
    if (cached) {
      setAnalysis(cached.analysis)
      setProductPayload(cached.productPayload)
      setDetailLoading(false)
    } else {
      setAnalysis(null)
      setProductPayload(null)
      setDetailLoading(true)
    }
  }, [analysisId, user?.id])

  useEffect(() => {
    if (!user || !analysisId) return
    let cancelled = false

    void (async () => {
      try {
        const a = await getSiteAnalysis(analysisId)
        if (cancelled) return
        const pl = await getAnalysisProducts(analysisId)
        if (cancelled) return
        setAnalysis(a)
        setProductPayload(pl)
        setAnalysisDetailCache(user.id, analysisId, {
          analysis: a,
          productPayload: pl,
        })
        setDetailError(null)
      } catch (e) {
        if (!cancelled) {
          setDetailError(
            e instanceof Error ? e.message : 'Erreur de chargement.',
          )
          const cached = getAnalysisDetailCache(user.id, analysisId)
          if (!cached) {
            setAnalysis(null)
            setProductPayload(null)
          }
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, analysisId])

  if (authLoading) {
    return (
      <div className="app-content analyses-page">
        <p className="analyses-status" aria-busy="true">
          Chargement…
        </p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!analysisId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-content analyses-page">
      <header className="analyses-header">
        <div>
          <h1 className="analyses-title">Résultat de l&apos;analyse</h1>
          {analysis?.url ? (
            <p className="analyses-subtitle" title={analysis.url}>
              {analysis.url}
            </p>
          ) : null}
        </div>
        <Link to="/" className="analyses-back-link">
          ← Accueil
        </Link>
      </header>

      <AnalyseResult
        loading={detailLoading}
        error={detailError}
        analysis={analysis}
        productPayload={productPayload}
      />
    </div>
  )
}
