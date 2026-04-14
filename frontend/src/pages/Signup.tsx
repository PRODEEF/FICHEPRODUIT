import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { useAuth } from '../auth/AuthContext'
import { authErrorMessage } from '../lib/authErrorMessage'
import { getSupabaseClient } from '../lib/supabase'

export function Signup() {
  const navigate = useNavigate()
  const { userEmail, loading: authLoading, configError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifyEmailSent, setVerifyEmailSent] = useState(false)

  useEffect(() => {
    if (authLoading || configError) return
    if (userEmail) navigate('/', { replace: true })
  }, [authLoading, userEmail, configError, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setVerifyEmailSent(false)

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      setError(
        'Configuration Supabase manquante. Vérifie le fichier .env du frontend.',
      )
      return
    }

    setSubmitting(true)
    try {
      const emailRedirectTo = `${window.location.origin}/`
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      })
      if (signError) {
        setError(authErrorMessage(signError))
        return
      }
      if (data.session) {
        navigate('/', { replace: true })
        return
      }
      if (data.user) {
        setVerifyEmailSent(true)
        return
      }
      setError('Inscription impossible pour le moment. Réessaie plus tard.')
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
            <h1>Inscription</h1>
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
          <h1>Inscription</h1>
          <p className="auth-intro">
            Déjà inscrit ?{' '}
            <Link to="/login" className="auth-inline-link">
              Se connecter
            </Link>
          </p>
          {verifyEmailSent ? (
            <p className="auth-banner auth-banner--success" role="status">
              Vérifie ta boîte mail : un lien de confirmation t’a été envoyé.
              Après confirmation, tu pourras te connecter.
            </p>
          ) : (
            <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="auth-field">
                <label htmlFor="signup-email">E-mail</label>
                <input
                  id="signup-email"
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
                <label htmlFor="signup-password">Mot de passe</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  disabled={submitting || authLoading}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="signup-password-confirm">
                  Confirmer le mot de passe
                </label>
                <input
                  id="signup-password-confirm"
                  name="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={passwordConfirm}
                  onChange={(ev) => setPasswordConfirm(ev.target.value)}
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
                {submitting ? 'Inscription…' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
