import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { ProductSheetTab } from '../../components/analysis/ProductSheetTab'

export function ProductSheet() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      void navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  if (authLoading) {
    return (
      <div className="app-content analyses-page">
        <p className="analyses-status" aria-busy="true">
          Chargement…
        </p>
      </div>
    )
  }

  if (!user || !analysisId) {
    return null
  }

  return (
    <div className="app-content analyses-page">
      <header className="analyses-header">
        <div>
          <h1 className="analyses-title">Fiche produit type</h1>
          <p className="analyses-subtitle">
            Modèle pour le formatage des exports PrestaShop
          </p>
        </div>
        <Link
          to={`/analyses/${analysisId}`}
          className="analyses-back-link"
        >
          ← Retour au catalogue
        </Link>
      </header>
      <ProductSheetTab />
    </div>
  )
}
