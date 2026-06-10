import { Banner, Button, InputField } from '@shared/ui';

import { useProfileForm } from '../hooks/useProfileForm';
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../lib/authSchemas';

const SUCCESS_VISIBLE_MS = 5000;
const USERNAME_ERROR_ID = 'profile-username-error';

export function ProfileForm() {
  const { register, onSubmit, errors, isSubmitting, success, dismissSuccess } = useProfileForm();

  return (
    <>
      {success ? (
        <Banner
          variant="success"
          role="status"
          aria-live="polite"
          autoDismissAfterMs={SUCCESS_VISIBLE_MS}
          onDismiss={dismissSuccess}
        >
          Changement enregistré.
        </Banner>
      ) : null}

      <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void onSubmit(e)}>
        <InputField
          id="profile-username"
          label="Nom d’utilisateur"
          type="text"
          autoComplete="username"
          required
          minLength={USERNAME_MIN_LENGTH}
          maxLength={USERNAME_MAX_LENGTH}
          showCharacterCount
          placeholder="Comment voulez-vous être appelé ?"
          error={errors.username?.message}
          errorId={USERNAME_ERROR_ID}
          disabled={isSubmitting}
          {...register('username')}
        />

        {errors.root?.message ? (
          <p className="m-0 text-sm text-red-500" role="alert">
            {errors.root.message}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </>
  );
}
