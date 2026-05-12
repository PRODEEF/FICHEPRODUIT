import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { parseAsFullSiteUrl } from '@lib/siteUrl';
import { getSupabaseClient } from '@shared/supabase';
import { AnalysisProgress } from '@shared/components/AnalysisProgress';
import { useAuth } from '@shared/hooks/useAuth';
import { useSiteAnalysis } from '@shared/hooks/useSiteAnalysis';
import { Banner, Button, Card, InputField, PageSection, TextLink } from '@shared/ui';

import { PasswordField } from '../components/PasswordField';
import { authErrorMessage } from '../lib/authErrorMessage';
import { writePendingSignup } from '../lib/pendingSignupStorage';
import { clearPendingAutoAnalyzeForUser } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import { signupSchema, type SignupInput } from '../lib/authSchemas';

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail, loading: authLoading, configError, refreshProfile } = useAuth();
  const [signupUrlAnalysisActive, setSignupUrlAnalysisActive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyEmailSent, setVerifyEmailSent] = useState(false);

  const { runAnalysis, analysisOpen, siteAnalysis, dismissError } = useSiteAnalysis({
    onSuccess: (summary) => {
      void navigate(`/catalog/${summary.id}`);
    },
  });

  const dismissSignupAnalysis = useCallback(() => {
    dismissError();
    setSignupUrlAnalysisActive(false);
  }, [dismissError]);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      username: '',
      websiteUrl: '',
      password: '',
      passwordConfirm: '',
    },
  });

  // useWatch au lieu de watch() pour limiter les re-renders aux champs concernés
  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });
  const passwordConfirmValue = useWatch({ control, name: 'passwordConfirm', defaultValue: '' });
  const websiteUrlValue = useWatch({ control, name: 'websiteUrl', defaultValue: '' });

  // Pré-remplit l'URL depuis le query param
  const urlFromQuery = searchParams.get('url');
  useEffect(() => {
    if (!urlFromQuery) return;
    const normalized = parseAsFullSiteUrl(urlFromQuery.trim());
    if (normalized) {
      queueMicrotask(() => {
        void setValue('websiteUrl', normalized);
      });
    }
  }, [urlFromQuery, setValue]);

  // Redirige si déjà connecté
  useEffect(() => {
    if (authLoading || configError) return;
    if (!userEmail) return;
    if (signupUrlAnalysisActive || analysisOpen) return;
    void navigate('/', { replace: true });
  }, [authLoading, configError, userEmail, signupUrlAnalysisActive, analysisOpen, navigate]);

  const onSubmit = useCallback(
    async (data: SignupInput) => {
      setFormError(null);
      setVerifyEmailSent(false);

      const supabase = getSupabaseClient();
      if (!supabase) {
        setFormError('Configuration Supabase manquante.');
        return;
      }

      const emailTrim = data.email.trim();
      const normalizedUsername = data.username.trim();
      const websiteUrl = data.websiteUrl;

      const { data: authData, error: signError } = await supabase.auth.signUp({
        email: emailTrim,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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
          setError('email', { message });
        } else if (code === 'weak_password' || code === 'same_password') {
          setError('password', { message });
        } else {
          setFormError(message);
        }
        return;
      }

      if (authData.session?.user) {
        const userId = authData.session.user.id;
        const repo = createSupabaseUserRepository(supabase);
        await repo.updateProfile(userId, {
          username: normalizedUsername,
          website_url: websiteUrl === '' ? null : websiteUrl,
          pending_auto_analyze: websiteUrl !== '',
        });
        await refreshProfile();
        if (websiteUrl) {
          setSignupUrlAnalysisActive(true);
          try {
            const outcome = await runAnalysis(websiteUrl);
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

      if (authData.user) {
        writePendingSignup({
          email: emailTrim,
          username: normalizedUsername,
          websiteUrl,
          pendingAutoAnalyze: websiteUrl !== '',
        });
        setVerifyEmailSent(true);
        return;
      }

      setFormError('Inscription impossible pour le moment. Réessayez plus tard.');
    },
    [navigate, refreshProfile, runAnalysis, setError],
  );

  if (configError) {
    return (
      <PageSection className="max-w-2xl pt-8">
        <Card className="mx-auto w-full max-w-[34rem]">
          <h1>Inscription</h1>
          <Banner variant="error">
            Variables d'environnement Supabase manquantes. Copiez{' '}
            <code className="break-all text-[0.8em]">frontend/.env.example</code> vers{' '}
            <code className="break-all text-[0.8em]">frontend/.env</code> et renseignez l'URL ainsi
            que la clé anonyme.
          </Banner>
        </Card>
      </PageSection>
    );
  }

  const isDisabled = isSubmitting || authLoading || signupUrlAnalysisActive;

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
            {websiteUrlValue.trim() ? (
              <> À la première connexion, l'analyse de votre site démarrera automatiquement.</>
            ) : null}
          </Banner>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          >
            <InputField
              id="signup-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              error={errors.email?.message}
              errorId="signup-email-error"
              disabled={isDisabled}
              {...register('email')}
            />
            <InputField
              id="signup-username"
              label="Nom d'utilisateur"
              type="text"
              autoComplete="username"
              placeholder="Marie Dupont"
              required
              maxLength={30}
              error={errors.username?.message}
              errorId="signup-username-error"
              disabled={isDisabled}
              {...register('username')}
            />
            <InputField
              id="signup-website"
              label="URL de votre site web (facultatif)"
              type="url"
              inputMode="url"
              placeholder="https://exemple.fr"
              error={errors.websiteUrl?.message}
              errorId="signup-website-error"
              disabled={isDisabled}
              {...register('websiteUrl')}
            />
            <PasswordField
              id="signup-password"
              label="Mot de passe"
              autoComplete="new-password"
              placeholder="Veuillez entrer un mot de passe"
              required
              value={passwordValue}
              error={errors.password?.message}
              showStrengthMeter
              disabled={isDisabled}
              {...register('password')}
            />
            <PasswordField
              id="signup-password-confirm"
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              placeholder="Saisissez le même mot de passe"
              value={passwordConfirmValue}
              error={errors.passwordConfirm?.message}
              disabled={isDisabled}
              {...register('passwordConfirm')}
            />
            {formError ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" variant="gradient" disabled={isDisabled}>
              {isSubmitting ? 'Inscription…' : 'Créer mon compte'}
            </Button>
          </form>
        )}
      </Card>
    </PageSection>
  );
}
