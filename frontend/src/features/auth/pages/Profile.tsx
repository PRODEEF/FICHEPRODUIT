import React, { useEffect, useState } from 'react';

import { parseZodFieldErrors } from '@lib/parseZodErrors';
import { getSupabaseClient } from '@shared/supabase';
import { useAuth } from '@shared/hooks/useAuth';
import { Banner, Button, InputField } from '@ui';

import { profileSchema } from '../lib/authSchemas';
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
    </div>
  );
}
