import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';
import { getSupabaseClient } from '@shared/supabase';
import { parseZodFieldErrors } from '@lib/parseZodErrors';
import { Banner, Button, Card, InputField, PageSection, TextLink } from '@ui';

import { loginSchema } from '../lib/authSchemas';
import { PasswordField } from '../components/PasswordField';
import { signInWithEmailPassword } from '../lib/credentialsAuth';
import type { LoginFieldErrors, LoginFieldKey } from '../types';

export function Login() {
  const navigate = useNavigate();
  const { userEmail, loading: authLoading, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailErrorId = 'login-email-error';

  useEffect(() => {
    if (authLoading || configError) return;
    if (userEmail) void navigate('/catalog', { replace: true });
  }, [authLoading, userEmail, configError, navigate]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(parseZodFieldErrors<LoginFieldKey>(result.error));
      return;
    }

    const { email: emailTrim, password: passwordVal } = result.data;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }
    setSubmitting(true);
    try {
      const authResult = await signInWithEmailPassword(supabase, emailTrim, passwordVal);
      if (!authResult.ok) {
        const code = authResult.code?.toLowerCase() ?? '';
        if (code === 'email_not_confirmed') {
          setFieldErrors({ email: authResult.message });
        } else if (code === 'invalid_credentials' || code === 'invalid_grant') {
          setFieldErrors({ password: authResult.message });
        } else {
          setFieldErrors({});
          setFormError(authResult.message);
        }
        return;
      }
      void navigate('/catalog', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  function clearEmailError() {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
    setFormError(null);
  }

  function clearPasswordError() {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.password;
      return next;
    });
    setFormError(null);
  }

  if (configError) {
    return (
      <PageSection className="max-w-2xl pt-8">
        <Card className="mx-auto w-full max-w-[30rem]">
          <h1>Connexion</h1>
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
  const passwordErr = fieldErrors.password;

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[30rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">Connexion</h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          Pas encore de compte ? <TextLink to="/signup">Créer un compte</TextLink>
        </p>
        <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void handleSubmit(e)}>
          <InputField
            id="login-email"
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
              clearEmailError();
            }}
            disabled={submitting || authLoading}
          />
          <PasswordField
            id="login-password"
            label="Mot de passe"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={passwordErr}
            onChange={(ev) => {
              setPassword(ev.target.value);
              clearPasswordError();
            }}
            disabled={submitting || authLoading}
          />
          {formError ? (
            <p className="m-0 text-sm text-red-500" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" variant="gradient" disabled={submitting || authLoading}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm">
          <TextLink to="/forgot-password">Mot de passe oublié ?</TextLink>
        </p>
      </Card>
    </PageSection>
  );
}
