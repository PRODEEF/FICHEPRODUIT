import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { parseZodFieldErrors } from '@lib/parseZodErrors';
import { getSupabaseClient } from '@shared/supabase';
import { useAuth } from '@shared/hooks/useAuth';
import { Banner, Button, InputField, TextLink } from '@ui';

import { PasswordField } from '../components/PasswordField';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordInput,
} from '../lib/authSchemas';
import { changePasswordWithVerification } from '../lib/passwordAuth';
import { saveUserProfile } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

type ProfileFieldErrors = Partial<Record<'username', string>>;

const SUCCESS_VISIBLE_MS = 5000;

export function Profile() {
  const { user, userEmail, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const usernameErrorId = 'profile-username-error';

  const {
    register: registerPassword,
    watch: watchPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      passwordConfirm: '',
    },
  });

  useEffect(() => {
    queueMicrotask(() => {
      setUsername(profile?.username ?? '');
    });
  }, [profile?.username]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccess(false);

    if (!user) return;

    const parsed = profileSchema.safeParse({ username });
    if (!parsed.success) {
      setFieldErrors(parseZodFieldErrors<'username'>(parsed.error));
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }

    setSubmitting(true);
    try {
      const repo = createSupabaseUserRepository(supabase);
      const result = await saveUserProfile(repo, user, parsed.data);
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setSuccess(true);
      await refreshProfile();
    } finally {
      setSubmitting(false);
    }
  }

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    if (!userEmail) {
      toast.error('Impossible de modifier le mot de passe : e-mail du compte indisponible.');
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }
    const result = await changePasswordWithVerification(
      supabase,
      userEmail,
      data.currentPassword,
      data.newPassword,
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    resetPasswordForm();
    toast.success('Mot de passe mis à jour.');
  };

  function clearFieldError() {
    setFieldErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([k]) => k !== 'username'),
      ),
    );
    setFormError(null);
  }

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-6">
        <div>
          <h1 className="m-0 text-3xl font-extrabold text-text-primary">Mon profil</h1>
          <p className="mt-1 text-sm text-text-muted">Mettez à jour vos informations de compte</p>
        </div>
      </header>

      <p className="mb-4 text-sm text-text-secondary">
        Compte connecté : <strong>{userEmail}</strong>
      </p>

      {success ? (
        <Banner
          className="mb-4 max-w-lg"
          variant="success"
          role="status"
          aria-live="polite"
          autoDismissAfterMs={SUCCESS_VISIBLE_MS}
          onDismiss={() => void setSuccess(false)}
        >
          Changement enregistré.
        </Banner>
      ) : null}

      <form
        className="flex max-w-lg flex-col gap-4"
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
      >
        <InputField
          id="profile-username"
          label="Nom d’utilisateur"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          showCharacterCount
          placeholder="Comment voulez-vous être appelé ?"
          error={fieldErrors.username}
          errorId={usernameErrorId}
          value={username}
          onChange={(ev) => {
            setUsername(ev.target.value);
            clearFieldError();
          }}
          disabled={submitting}
        />

        {formError ? (
          <p className="m-0 text-sm text-red-500" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>

      <section className="mt-12 max-w-lg border-t border-border pt-8">
        <h2 className="m-0 mb-1 text-xl font-bold text-text-primary">Mot de passe</h2>
        <p className="mb-4 text-sm text-text-muted">
          <TextLink to="/forgot-password">Mot de passe oublié ?</TextLink>
        </p>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => void handlePasswordSubmit(onPasswordSubmit)(e)}
        >
          <PasswordField
            id="profile-current-password"
            label="Mot de passe actuel"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={watchPassword('currentPassword')}
            error={passwordErrors.currentPassword?.message}
            disabled={isPasswordSubmitting}
            {...registerPassword('currentPassword')}
          />
          <PasswordField
            id="profile-new-password"
            label="Nouveau mot de passe"
            autoComplete="new-password"
            placeholder="Veuillez entrer un mot de passe"
            required
            showStrengthMeter
            value={watchPassword('newPassword')}
            error={passwordErrors.newPassword?.message}
            disabled={isPasswordSubmitting}
            {...registerPassword('newPassword')}
          />
          <PasswordField
            id="profile-password-confirm"
            label="Confirmer le nouveau mot de passe"
            autoComplete="new-password"
            placeholder="Saisissez le même mot de passe"
            required
            value={watchPassword('passwordConfirm')}
            error={passwordErrors.passwordConfirm?.message}
            disabled={isPasswordSubmitting}
            {...registerPassword('passwordConfirm')}
          />
          <Button type="submit" disabled={isPasswordSubmitting}>
            {isPasswordSubmitting ? 'Enregistrement…' : 'Modifier le mot de passe'}
          </Button>
        </form>
      </section>
    </div>
  );
}
