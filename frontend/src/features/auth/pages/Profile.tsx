import { useEffect, useState, type FormEvent } from 'react';

import { getSupabaseClient } from '@lib/api/supabase';
import { parseZodFieldErrors } from '@lib/utils/parseZodErrors';
import { Banner, Button, InputField } from '@ui';

import { useAuth } from '../useAuth';
import { profileSchema } from '../lib/authSchemas';
import { saveUserProfile } from '../lib/userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

type ProfileFieldErrors = Partial<Record<'username' | 'websiteUrl', string>>;

const SUCCESS_VISIBLE_MS = 5000;

export function Profile() {
  const { user, userEmail, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const usernameErrorId = 'profile-username-error';
  const websiteErrorId = 'profile-website-error';

  useEffect(() => {
    setUsername(profile?.username ?? '');
    setWebsiteUrl(profile?.website_url ?? '');
  }, [profile?.username, profile?.website_url]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccess(false);

    if (!user) return;

    const parsed = profileSchema.safeParse({ username, websiteUrl });
    if (!parsed.success) {
      setFieldErrors(parseZodFieldErrors<'username' | 'websiteUrl'>(parsed.error));
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifie le fichier .env du frontend.');
      return;
    }

    setSubmitting(true);
    try {
      const repo = createSupabaseUserRepository(supabase);
      const result = await saveUserProfile(repo, user, parsed.data);
      if (result.ok === false) {
        setFormError(result.message);
        return;
      }
      setSuccess(true);
      await refreshProfile();
    } finally {
      setSubmitting(false);
    }
  }

  function clearFieldError(key: 'username' | 'websiteUrl') {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
          onDismiss={() => setSuccess(false)}
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
            clearFieldError('username');
          }}
          disabled={submitting}
        />

        <InputField
          id="profile-website"
          label="URL de votre site web (facultatif)"
          name="websiteUrl"
          type="url"
          inputMode="url"
          placeholder="https://exemple.fr"
          error={fieldErrors.websiteUrl}
          errorId={websiteErrorId}
          value={websiteUrl}
          onChange={(ev) => {
            setWebsiteUrl(ev.target.value);
            clearFieldError('websiteUrl');
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
