import { Controller } from 'react-hook-form';

import { Button, TextLink } from '@shared/ui';

import { PasswordField } from './PasswordField';
import { useChangePassword } from '../hooks/useChangePassword';

export function ChangePasswordForm() {
  const { register, control, onSubmit, errors, isSubmitting, newPasswordValue } =
    useChangePassword();

  return (
    <section className="border-t border-border pt-8">
      <h2 className="m-0 mb-1 text-xl font-bold text-text-primary">Mot de passe</h2>
      <p className="mb-4 text-sm text-text-muted">
        <TextLink to="/forgot-password">Mot de passe oublié ?</TextLink>
      </p>
      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void onSubmit(e)}>
        <Controller
          name="currentPassword"
          control={control}
          render={({ field }) => (
            <PasswordField
              id="profile-current-password"
              label="Mot de passe actuel"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              error={errors.currentPassword?.message}
              disabled={isSubmitting}
              {...field}
            />
          )}
        />
        <PasswordField
          id="profile-new-password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          placeholder="Veuillez entrer un mot de passe"
          required
          showStrengthMeter
          value={newPasswordValue}
          error={errors.newPassword?.message}
          disabled={isSubmitting}
          {...register('newPassword')}
        />
        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field }) => (
            <PasswordField
              id="profile-password-confirm"
              label="Confirmer le nouveau mot de passe"
              autoComplete="new-password"
              placeholder="Saisissez le même mot de passe"
              required
              error={errors.passwordConfirm?.message}
              disabled={isSubmitting}
              {...field}
            />
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : 'Modifier le mot de passe'}
        </Button>
      </form>
    </section>
  );
}
