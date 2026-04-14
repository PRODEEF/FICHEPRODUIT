import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { BackgroundGlow } from '../components/layout/BackgroundGlow'
import { authErrorMessage } from '../lib/authErrorMessage'
import {
  getPasswordResetRedirectUrl,
  getSupabaseClient,
} from '../lib/supabase'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: getPasswordResetRedirectUrl() },
      )
      if (resetError) {
        setError(authErrorMessage(resetError))
        return
      }
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <BackgroundGlow />
      <div className="auth-page">
        <div className="auth-card">
          <h1>Mot de passe oublié</h1>
          <p className="auth-intro">
            <Link to="/login" className="auth-inline-link">
              Retour à la connexion
            </Link>
          </p>
          {done ? (
            <p className="auth-banner auth-banner--success" role="status">
              Si cette adresse est associée à un compte, tu recevras un e-mail
              avec un lien pour choisir un nouveau mot de passe.
            </p>
          ) : (
            <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
              <div className="auth-field">
                <label htmlFor="forgot-email">E-mail</label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={submitting}
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
                disabled={submitting}
              >
                {submitting ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
