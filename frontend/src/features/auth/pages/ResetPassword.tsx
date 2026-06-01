import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { getSupabaseClient } from '@shared/supabase';
import { Banner, Button, Card, PageSection, TextLink } from '@shared/ui';

import { PasswordField } from '../components/PasswordField';
import { resetPasswordSchema, type ResetPasswordInput } from '../lib/authSchemas';
import { subscribePasswordRecoveryGate } from '../lib/passwordRecoveryGate';
import { updatePasswordAndSignOut } from '../lib/passwordAuth';
import type { PasswordRecoveryGateState } from '../types';

export function ResetPassword() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<PasswordRecoveryGateState>('loading');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', passwordConfirm: '' },
  });

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => {
        setGate('invalid');
      });
      return;
    }

    return subscribePasswordRecoveryGate(supabase, (ok) => {
      setGate(ok ? 'ready' : 'invalid');
    });
  }, []);

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante.');
      return;
    }
    const result = await updatePasswordAndSignOut(supabase, data.password);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    toast.success('Mot de passe enregistré. Connectez-vous avec votre nouveau mot de passe.');
    void navigate('/login', { replace: true });
  };

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[30rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">Nouveau mot de passe</h1>
        {gate === 'loading' ? (
          <p className="mb-5 text-center text-sm text-text-secondary" aria-busy="true">
            Vérification du lien…
          </p>
        ) : null}
        {gate === 'invalid' ? (
          <>
            <Banner variant="error" role="alert">
              Ce lien de réinitialisation est invalide ou expiré. Demandez un nouveau lien depuis la
              page de connexion.
            </Banner>
            <p className="mt-5 text-center text-sm">
              <TextLink to="/forgot-password">Renvoyer un lien</TextLink>
              {' · '}
              <TextLink to="/login">Connexion</TextLink>
            </p>
          </>
        ) : null}
        {gate === 'ready' ? (
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          >
            <PasswordField
              id="reset-password"
              label="Nouveau mot de passe"
              autoComplete="new-password"
              placeholder="Veuillez entrer un mot de passe"
              required
              showStrengthMeter
              value={watch('password')}
              error={errors.password?.message}
              disabled={isSubmitting}
              {...register('password')}
            />
            <PasswordField
              id="reset-password-confirm"
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              placeholder="Saisissez le même mot de passe"
              required
              value={watch('passwordConfirm')}
              error={errors.passwordConfirm?.message}
              disabled={isSubmitting}
              {...register('passwordConfirm')}
            />
            {formError ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </Button>
          </form>
        ) : null}
      </Card>
    </PageSection>
  );
}
