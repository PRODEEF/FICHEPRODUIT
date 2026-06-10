import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '@shared/hooks/useAuth';
import { getSupabaseClient } from '@shared/supabase';
import { Button, Card, InputField, PageSection, TextLink } from '@ui';

import { PasswordField } from '../components/PasswordField';
import { buildAuthEmailQuery, parseAuthEmailFromQuery } from '../lib/authEmailQuery';
import { signInWithEmailPassword } from '../lib/credentialsAuth';
import { loginSchema, type LoginInput } from '../lib/authSchemas';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail, loading: authLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginEmail = useWatch({ control, name: 'email', defaultValue: '' });
  const loginPassword = useWatch({ control, name: 'password', defaultValue: '' });

  const emailFromQuery = searchParams.get('email');
  useEffect(() => {
    const parsed = parseAuthEmailFromQuery(emailFromQuery);
    if (parsed) {
      queueMicrotask(() => {
        void setValue('email', parsed);
      });
    }
  }, [emailFromQuery, setValue]);

  useEffect(() => {
    if (authLoading) return;
    if (userEmail) void navigate('/catalog', { replace: true });
  }, [authLoading, userEmail, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }
    const authResult = await signInWithEmailPassword(supabase, data.email, data.password);
    if (!authResult.ok) {
      const code = authResult.code?.toLowerCase() ?? '';
      if (code === 'email_not_confirmed') {
        setError('email', { message: authResult.message });
      } else if (code === 'invalid_credentials' || code === 'invalid_grant') {
        setError('password', { message: authResult.message });
      } else {
        setFormError(authResult.message);
      }
      return;
    }
    void navigate('/catalog', { replace: true });
  };

  const isDisabled = isSubmitting || authLoading;

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[30rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">Connexion</h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          Pas encore de compte ? <TextLink to="/signup">Créer un compte</TextLink>
        </p>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        >
          <InputField
            id="login-email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
            error={errors.email?.message}
            errorId="login-email-error"
            disabled={isDisabled}
            {...register('email')}
          />
          <PasswordField
            id="login-password"
            label="Mot de passe"
            autoComplete="current-password"
            placeholder="••••••••"
            value={loginPassword}
            error={errors.password?.message}
            disabled={isDisabled}
            {...register('password')}
          />
          {formError ? (
            <p className="m-0 text-sm text-red-500" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" variant="gradient" disabled={isDisabled}>
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm">
          <TextLink to={`/forgot-password${buildAuthEmailQuery(loginEmail)}`}>
            Mot de passe oublié ?
          </TextLink>
        </p>
      </Card>
    </PageSection>
  );
}
