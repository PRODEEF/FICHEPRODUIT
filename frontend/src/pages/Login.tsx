import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { useAuth } from '../auth/AuthContext'
import { authErrorMessage } from '../lib/authErrorMessage'
import { getSupabaseClient } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const { userEmail, loading: authLoading, configError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || configError) return
    if (userEmail) navigate('/', { replace: true })
  }, [authLoading, userEmail, configError, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const supabase = getSupabaseClient()
    if (!supabase) {
      setError(
        'Configuration Supabase manquante. Vérifie le fichier .env du frontend.',
      )
      return
    }
    setSubmitting(true)
    try {
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signError) {
        setError(authErrorMessage(signError))
        return
      }
      navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  if (configError) {
    return (
      <>
        <BackgroundGlow />
        <div className="auth-page">
          <div className="auth-card">
            <h1>Connexion</h1>
            <p className="auth-banner auth-banner--error">
              Variables d’environnement Supabase manquantes. Copie{' '}
              <code className="auth-code">frontend/.env.example</code> vers{' '}
              <code className="auth-code">frontend/.env</code> et renseigne
              l’URL ainsi que la clé anonyme.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <BackgroundGlow />
      <div className="auth-page">
        <div className="auth-card">
          <h1>Connexion</h1>
          <p className="auth-intro">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="auth-inline-link">
              Créer un compte
            </Link>
          </p>
          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="auth-field">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={submitting || authLoading}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={submitting || authLoading}
              />
            </div>
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="btn-auth-primary"
              disabled={submitting || authLoading}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <p className="auth-footer-link">
            <Link to="/forgot-password" className="auth-inline-link">
              Mot de passe oublié ?
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
