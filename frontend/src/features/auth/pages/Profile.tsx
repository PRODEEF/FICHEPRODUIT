import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../useAuth';
import { getSupabaseClient } from '../../../lib/supabase';
import { saveUserProfile } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

export function Profile() {
  const navigate = useNavigate();
  const { user, userEmail, profile, profileLoading, loading, configError, refreshProfile } =
    useAuth();
  const [username, setUsername] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (configError || loading) return;
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [configError, loading, user, navigate]);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (profile) {
      setUsername(profile.username);
      setWebsiteUrl(profile.website_url ?? '');
    } else {
      setUsername('');
      setWebsiteUrl('');
    }
  }, [user, profile, profileLoading]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Configuration Supabase manquante. Vérifie le fichier .env du frontend.');
      return;
    }

    setSubmitting(true);
    try {
      const repo = createSupabaseUserRepository(supabase);
      const result = await saveUserProfile(repo, user, {
        usernameRaw: username,
        websiteUrlRaw: websiteUrl,
      });
      if (result.ok === false) {
        setError(result.message);
        return;
      }
      setSuccess(true);
      await refreshProfile();
    } finally {
      setSubmitting(false);
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
            <code className="auth-code">frontend/.env</code> et renseigne l’URL ainsi que la clé
            anonyme.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
    );
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
              URL de votre site web <span className="auth-optional">(facultatif)</span>
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
          <button type="submit" className="btn-auth-primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
