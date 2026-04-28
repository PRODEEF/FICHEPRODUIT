import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { getSupabaseClient } from '../../lib/supabase'
import { parseAsSiteUrl } from '../../lib/siteUrl'
import { authMetadataForDisplayName } from '../../lib/authUserDisplay'
import { normalizeUsername, validateUsernameInput } from '../../lib/username'

export function Profile() {
  const navigate = useNavigate()
  const {
    user,
    userEmail,
    profile,
    profileLoading,
    loading,
    configError,
    refreshProfile,
  } = useAuth()
  const [username, setUsername] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (configError || loading) return
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [configError, loading, user, navigate])

  useEffect(() => {
    if (!user || profileLoading) return
    if (profile) {
      setUsername(profile.username)
      setWebsiteUrl(profile.website_url ?? '')
    } else {
      setUsername('')
      setWebsiteUrl('')
    }
  }, [user, profile, profileLoading])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!user) return

    const normalizedUsername = normalizeUsername(username)
    const usernameErr = validateUsernameInput(normalizedUsername)
    if (usernameErr) {
      setError(usernameErr)
      return
    }

    const siteRaw = websiteUrl.trim()
    let website_url: string | null = null
    if (siteRaw) {
      const parsed = parseAsSiteUrl(siteRaw)
      if (!parsed) {
        setError(
          'URL du site invalide. Indique une adresse complète (https://…) ou un domaine (ex. monsite.fr).',
        )
        return
      }
      website_url = parsed
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
      const row = {
        username: normalizedUsername,
        website_url,
        updated_at: new Date().toISOString(),
      }

      if (profile) {
        const { error: upError } = await supabase
          .from('profiles')
          .update(row)
          .eq('id', user.id)
        if (upError) {
          setError(upError.message || 'Enregistrement impossible. Réessaie.')
          return
        }
      } else {
        const { error: insError } = await supabase.from('profiles').insert({
          id: user.id,
          username: normalizedUsername,
          website_url,
        })
        if (insError) {
          setError(insError.message || 'Enregistrement impossible. Réessaie.')
          return
        }
      }

      const existingMeta =
        user.user_metadata && typeof user.user_metadata === 'object'
          ? { ...user.user_metadata }
          : {}
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          ...existingMeta,
          ...authMetadataForDisplayName(normalizedUsername),
        },
      })
      if (authUpdateError) {
        setError(
          authUpdateError.message ||
            'Profil enregistré mais la mise à jour du compte Auth a échoué. Réessaie.',
        )
        await refreshProfile()
        return
      }

      setSuccess(true)
      await refreshProfile()
    } finally {
      setSubmitting(false)
    }
  }

  if (configError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Profil</h1>
          <p className="auth-banner auth-banner--error">
            Variables d’environnement Supabase manquantes. Copie{' '}
            <code className="auth-code">frontend/.env.example</code> vers{' '}
            <code className="auth-code">frontend/.env</code> et renseigne
            l’URL ainsi que la clé anonyme.
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loading || profileLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Profil</h1>
          <p className="auth-intro" aria-busy="true">
            Chargement…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
        <div className="auth-card">
          <h1>Profil</h1>
          <p className="auth-intro">
            Compte : <strong>{userEmail}</strong>
          </p>
          {success ? (
            <p className="auth-banner auth-banner--success" role="status">
              Profil enregistré.
            </p>
          ) : null}
          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="auth-field">
              <label htmlFor="profile-username">Nom d’utilisateur</label>
              <input
                id="profile-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="profile-website">
                URL de votre site web{' '}
                <span className="auth-optional">(facultatif)</span>
              </label>
              <input
                id="profile-website"
                name="websiteUrl"
                type="url"
                inputMode="url"
                placeholder="https://exemple.fr"
                value={websiteUrl}
                onChange={(ev) => setWebsiteUrl(ev.target.value)}
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
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
  )
}
