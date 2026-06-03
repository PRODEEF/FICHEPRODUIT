import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getSupabaseClient } from '@shared/supabase';
import { Banner, Button, Card, InputField, PageSection, TextLink } from '@shared/ui';

import { parseAuthEmailFromQuery } from '../lib/authEmailQuery';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../lib/authSchemas';
import { getPasswordResetRedirectUrl, requestPasswordResetEmail } from '../lib/passwordAuth';

export function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const emailFromQuery = searchParams.get('email');
  useEffect(() => {
    const parsed = parseAuthEmailFromQuery(emailFromQuery);
    if (parsed) {
      queueMicrotask(() => {
        void setValue('email', parsed);
      });
    }
  }, [emailFromQuery, setValue]);

  const onSubmit = async (data: ForgotPasswordInput) => {
    setFormError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }
    const result = await requestPasswordResetEmail(
      supabase,
      data.email,
      getPasswordResetRedirectUrl(),
    );
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setDone(true);
  };

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[30rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">
          Mot de passe oublié
        </h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          <TextLink to="/login">Retour à la connexion</TextLink>
        </p>
        {done ? (
          <Banner variant="success" role="status">
            Si cette adresse est associée à un compte, vous recevrez un e-mail avec un lien pour
            choisir un nouveau mot de passe.
          </Banner>
        ) : (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          >
            <InputField
              id="forgot-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              error={errors.email?.message}
              errorId="forgot-email-error"
              disabled={isSubmitting}
              {...register('email')}
            />
            {formError ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
            </Button>
          </form>
        )}
      </Card>
    </PageSection>
  );
}
