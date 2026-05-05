import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { getSupabaseClient } from '@lib/supabase';
import { parseAsFullSiteUrl } from '@lib/siteUrl';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';

import { AnalysisProgress } from '../../landing/components/AnalysisProgress';

import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../useAuth';
import { authErrorMessage } from '../lib/authErrorMessage';
import { writePendingSignup } from '../lib/pendingSignupStorage';
import { collectSignupFieldErrors } from '../lib/signupFieldValidation';
import { clearPendingAutoAnalyzeForUser } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import type { SignupFieldErrors, SignupFieldKey } from '../types';

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);

  const urlFromQuery = searchParams.get('url');

  useEffect(() => {
    if (!urlFromQuery) return;
    const normalized = parseAsFullSiteUrl(urlFromQuery.trim());
    if (normalized) setWebsiteUrl(normalized);
  }, [urlFromQuery]);

  const emailErrorId = 'signup-email-error';
  const usernameErrorId = 'signup-username-error';
  const websiteErrorId = 'signup-website-error';

  useEffect(() => {
    if (authLoading || configError) return;
    if (!userEmail) return;
    if (signupUrlAnalysisActive || analysisOpen) return;
    navigate('/', { replace: true });
  }, [authLoading, configError, userEmail, signupUrlAnalysisActive, analysisOpen, navigate]);

  function clearFieldError(key: SignupFieldKey) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setVerifyEmailSent(false);

    const validation = collectSignupFieldErrors({
      email,
      username,
      websiteUrl,
      password,
      passwordConfirm,
    });
    if (validation.ok === false) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    const { emailTrim, normalizedUsername, website_url } = validation.payload;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante.');
      return;
    }

    setFieldErrors({});

    setSubmitting(true);
    try {
      const emailRedirectTo = `${window.location.origin}/`;
      const { data, error: signError } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          emailRedirectTo,
          // Visible dans le dashboard Supabase (user_metadata / « Display name » selon les vues).
          data: {
            display_name: normalizedUsername,
            full_name: normalizedUsername,
          },
        },
      });
      if (signError) {
        const message = authErrorMessage(signError);
        const code = signError.code?.toLowerCase() ?? '';
        if (code === 'user_already_registered') {
          setFieldErrors({ email: message });
        } else if (code === 'weak_password' || code === 'same_password') {
          setFieldErrors({ password: message });
        } else {
          setFormError(message);
        }
        return;
      }
      if (data.session?.user) {
        const userId = data.session.user.id;
        const repo = createSupabaseUserRepository(supabase);
        await repo.updateProfile(userId, {
          username: normalizedUsername,
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
          email: emailTrim,
          username: normalizedUsername,
          websiteUrl: website_url,
          pendingAutoAnalyze: website_url !== '',
        });
        setVerifyEmailSent(true);
        return;
      }
      setFormError('Inscription impossible pour le moment. Réessaie plus tard.');
    } catch (err) {
      setFormError(
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

  const emailErr = fieldErrors.email;
  const usernameErr = fieldErrors.username;
  const websiteErr = fieldErrors.websiteUrl;
  const passwordErr = fieldErrors.password;
  const passwordConfirmErr = fieldErrors.passwordConfirm;

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
          <form className="auth-form" noValidate onSubmit={(e) => void handleSubmit(e)}>
            <div className="auth-field">
              <label htmlFor="signup-email">E-mail</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@exemple.fr"
                aria-required="true"
                aria-invalid={Boolean(emailErr)}
                aria-describedby={emailErr ? emailErrorId : undefined}
                value={email}
                onChange={(ev) => {
                  setEmail(ev.target.value);
                  clearFieldError('email');
                }}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
              {emailErr ? (
                <p id={emailErrorId} className="auth-error" role="alert">
                  {emailErr}
                </p>
              ) : null}
            </div>
            <div className="auth-field">
              <label htmlFor="signup-username">Nom d’utilisateur</label>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Marie Dupont"
                aria-required="true"
                aria-invalid={Boolean(usernameErr)}
                aria-describedby={usernameErr ? usernameErrorId : undefined}
                maxLength={30}
                value={username}
                onChange={(ev) => {
                  setUsername(ev.target.value);
                  clearFieldError('username');
                }}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
              {usernameErr ? (
                <p id={usernameErrorId} className="auth-error" role="alert">
                  {usernameErr}
                </p>
              ) : null}
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
                aria-invalid={Boolean(websiteErr)}
                aria-describedby={websiteErr ? websiteErrorId : undefined}
                value={websiteUrl}
                onChange={(ev) => {
                  setWebsiteUrl(ev.target.value);
                  clearFieldError('websiteUrl');
                }}
                disabled={submitting || authLoading || signupUrlAnalysisActive}
              />
              {websiteErr ? (
                <p id={websiteErrorId} className="auth-error" role="alert">
                  {websiteErr}
                </p>
              ) : null}
            </div>
            <PasswordField
              id="signup-password"
              label="Mot de passe"
              name="password"
              autoComplete="new-password"
              placeholder="Veuillez entrer un mot de passe"
              required
              value={password}
              error={passwordErr}
              showStrengthMeter
              onChange={(ev) => {
                setPassword(ev.target.value);
                clearFieldError('password');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            <PasswordField
              id="signup-password-confirm"
              label="Confirmer le mot de passe"
              name="passwordConfirm"
              autoComplete="new-password"
              placeholder="Saisis le même mot de passe"
              value={passwordConfirm}
              error={passwordConfirmErr}
              onChange={(ev) => {
                setPasswordConfirm(ev.target.value);
                clearFieldError('passwordConfirm');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            {formError ? (
              <p className="auth-error" role="alert">
                {formError}
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
