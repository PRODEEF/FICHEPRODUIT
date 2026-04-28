import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export function MyStore() {
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

  if (!user) {
    return null
  }

  return (
    <div className="app-content analyses-page">
      <header className="analyses-header">
        <div>
          <h1 className="analyses-title">Mon magasin</h1>
          <p className="analyses-subtitle">
            Cette section sera bientôt disponible.
          </p>
        </div>
      </header>
      <p className="analyses-status">À venir</p>
    </div>
  )
}
