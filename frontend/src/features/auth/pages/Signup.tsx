import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { parseAsFullSiteUrl } from '@lib/siteUrl';
import { getSupabaseClient } from '@shared/supabase';
import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { useAuth } from '@shared/hooks/useAuth';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';
import { Banner, Button, Card, InputField, PageSection, TextLink } from '@shared/ui';

import { PasswordField } from '../components/PasswordField';
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
      void navigate(`/catalog/${summary.id}`);
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
    if (normalized) {
      queueMicrotask(() => {
        setWebsiteUrl(normalized);
      });
    }
  }, [urlFromQuery]);

  const emailErrorId = 'signup-email-error';
  const usernameErrorId = 'signup-username-error';
  const websiteErrorId = 'signup-website-error';

  useEffect(() => {
    if (authLoading || configError) return;
    if (!userEmail) return;
    if (signupUrlAnalysisActive || analysisOpen) return;
    void navigate('/', { replace: true });
  }, [authLoading, configError, userEmail, signupUrlAnalysisActive, analysisOpen, navigate]);

  function clearFieldError(key: SignupFieldKey) {
    setFieldErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([k]) => k !== key),
      ),
    );
    setFormError(null);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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
    if (!validation.ok) {
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
        void navigate('/', { replace: true });
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
      setFormError('Inscription impossible pour le moment. Réessayez plus tard.');
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : 'Inscription impossible pour le moment. Réessayez plus tard.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (configError) {
    return (
      <PageSection className="max-w-2xl pt-8">
        <Card className="mx-auto w-full max-w-[34rem]">
          <h1>Inscription</h1>
          <Banner variant="error">
            Variables d’environnement Supabase manquantes. Copiez{' '}
            <code className="break-all text-[0.8em]">frontend/.env.example</code> vers{' '}
            <code className="break-all text-[0.8em]">frontend/.env</code> et renseignez l’URL ainsi
            que la clé anonyme.
          </Banner>
        </Card>
      </PageSection>
    );
  }

  const emailErr = fieldErrors.email;
  const usernameErr = fieldErrors.username;
  const websiteErr = fieldErrors.websiteUrl;
  const passwordErr = fieldErrors.password;
  const passwordConfirmErr = fieldErrors.passwordConfirm;

  return (
    <PageSection className="max-w-2xl pt-8">
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissSignupAnalysis} />
      ) : null}
      <Card className="mx-auto w-full max-w-[34rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">Inscription</h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          Déjà inscrit ? <TextLink to="/login">Se connecter</TextLink>
        </p>
        {verifyEmailSent ? (
          <Banner variant="success" role="status">
            Vérifiez votre messagerie : un lien de confirmation vous a été envoyé. Après
            confirmation, vous pourrez vous connecter.
            {websiteUrl.trim() ? (
              <> À la première connexion, l’analyse de votre site démarrera automatiquement.</>
            ) : null}
          </Banner>
        ) : (
          <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void handleSubmit(e)}>
            <InputField
              id="signup-email"
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              error={emailErr}
              errorId={emailErrorId}
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                clearFieldError('email');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            <InputField
              id="signup-username"
              label="Nom d’utilisateur"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Marie Dupont"
              required
              maxLength={30}
              error={usernameErr}
              errorId={usernameErrorId}
              value={username}
              onChange={(ev) => {
                setUsername(ev.target.value);
                clearFieldError('username');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            <InputField
              id="signup-website"
              label="URL de votre site web (facultatif)"
              name="websiteUrl"
              type="url"
              inputMode="url"
              placeholder="https://exemple.fr"
              error={websiteErr}
              errorId={websiteErrorId}
              value={websiteUrl}
              onChange={(ev) => {
                setWebsiteUrl(ev.target.value);
                clearFieldError('websiteUrl');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
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
              placeholder="Saisissez le même mot de passe"
              value={passwordConfirm}
              error={passwordConfirmErr}
              onChange={(ev) => {
                setPasswordConfirm(ev.target.value);
                clearFieldError('passwordConfirm');
              }}
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            />
            {formError ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {formError}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="gradient"
              disabled={submitting || authLoading || signupUrlAnalysisActive}
            >
              {submitting ? 'Inscription…' : 'Créer mon compte'}
            </Button>
          </form>
        )}
      </Card>
    </PageSection>
  );
}
