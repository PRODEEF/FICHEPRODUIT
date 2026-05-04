import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnalysisProgress } from '../../../components/analysis/AnalysisProgress';
import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../useAuth';
import { authErrorMessage } from '../lib/authErrorMessage';
import { writePendingSignup } from '../lib/pendingSignupStorage';
import { clearPendingAutoAnalyzeForUser } from '../lib/userProfile';
import { useSiteAnalysis } from '../../../hooks/useSiteAnalysis';
import { getSupabaseClient } from '../../../lib/supabase';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import {
  validatePasswordMatch,
  validatePasswordMinLength,
  validateUsernameForAuth,
  parseOptionalWebsiteUrl,
} from '../lib/signupFieldValidation';

export function Signup() {
  const navigate = useNavigate();
  const { userEmail, loading: authLoading, configError, refreshProfile } = useAuth();
  const [signupUrlAnalysisActive, setSignupUrlAnalysisActive] = useState(false);
  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => {
      navigate(`/analyses/${summary.id}`);
    },
  });

  const dismissSignupAnalysis = useCallback(() => {
    dismissError();
    setSignupUrlAnalysisActive(false);
  }, [dismissError]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);

  useEffect(() => {
    if (authLoading || configError) return;
    if (!userEmail) return;
    if (signupUrlAnalysisActive || analysisOpen) return;
    navigate('/', { replace: true });
  }, [authLoading, configError, userEmail, signupUrlAnalysisActive, analysisOpen, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifyEmailSent(false);

    const pwdMatch = validatePasswordMatch(password, passwordConfirm);
    if (pwdMatch) {
      setError(pwdMatch);
      return;
    }

    const pwdLen = validatePasswordMinLength(password);
    if (pwdLen) {
      setError(pwdLen);
      return;
    }

    const userResult = validateUsernameForAuth(username);
    if (userResult.ok === false) {
      setError(userResult.message);
      return;
    }

    const siteRaw = websiteUrl.trim();
    let website_url = '';
    if (siteRaw) {
      const parsed = parseOptionalWebsiteUrl(
        siteRaw,
        'URL du site invalide. Indique une adresse complète (https://…) ou un domaine (ex. monsite.fr).',
      );
      if (parsed.ok === false) {
        setError(parsed.message);
        return;
      }
      website_url = parsed.website_url;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Configuration Supabase manquante.');
      return;
    }

    setSubmitting(true);
    try {
      const emailRedirectTo = `${window.location.origin}/`;
      const { data, error: signError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo },
      });
      if (signError) {
        setError(authErrorMessage(signError));
        return;
      }
      if (data.session?.user) {
        const userId = data.session.user.id;
        const repo = createSupabaseUserRepository(supabase);
        await repo.updateProfile(userId, {
          username: userResult.normalized,
          website_url: website_url === '' ? null : website_url,
          pending_auto_analyze: website_url !== '',
        });
        await refreshProfile();
        if (website_url) {
          setSignupUrlAnalysisActive(true);
          setSubmitting(false);
          try {
            const outcome = await runAnalysis(website_url);
            if (outcome === 'error_alert') {
              setSignupUrlAnalysisActive(false);
            }
          } finally {
            await clearPendingAutoAnalyzeForUser(userId);
          }
          return;
        }
        navigate('/', { replace: true });
        return;
      }

      if (data.user) {
        writePendingSignup({
          email: email.trim(),
          username: userResult.normalized,
          websiteUrl: website_url,
          pendingAutoAnalyze: website_url !== '',
        });
        setVerifyEmailSent(true);
        return;
      }
      setError('Inscription impossible pour le moment. Réessaie plus tard.');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Inscription impossible pour le moment. Réessaie plus tard.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (configError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Inscription</h1>
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

  return (
    <div className="auth-page">
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissSignupAnalysis} />
      ) : null}
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
            Vérifie ta boîte mail : un lien de confirmation t’a été envoyé. Après confirmation, tu
            pourras te connecter.
            {websiteUrl.trim() ? (
              <> À la première connexion, l’analyse de ton site démarrera automatiquement.</>
            ) : null}
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
                placeholder="vous@exemple.fr"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-username">Nom d’utilisateur</label>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Marie Dupont"
                required
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="signup-website">
                URL de votre site web <span className="auth-optional">(facultatif)</span>
              </label>
              <input
                id="signup-website"
                name="websiteUrl"
                type="url"
                inputMode="url"
                placeholder="https://exemple.fr"
                value={websiteUrl}
                onChange={(ev) => setWebsiteUrl(ev.target.value)}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
            </div>
            <PasswordField
              id="signup-password"
              label="Mot de passe"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            <PasswordField
              id="signup-password-confirm"
              label="Confirmer le mot de passe"
              name="passwordConfirm"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Saisis le même mot de passe"
              value={passwordConfirm}
              onChange={(ev) => setPasswordConfirm(ev.target.value)}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            {error ? (
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              className="btn-auth-primary"
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            >
              {submitting ? 'Inscription…' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
