import { useState, type FormEvent } from 'react';
import { getSupabaseClient } from '../../../shared/supabase';
import { Banner, Button, Card, InputField, PageSection, TextLink } from '@shared/ui';

import { getPasswordResetRedirectUrl, requestPasswordResetEmail } from '../lib/passwordAuth';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Configuration Supabase manquante. Vérifiez le fichier .env du frontend.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordResetEmail(
        supabase,
        email,
        getPasswordResetRedirectUrl(),
      );
      if (result.ok === false) {
        setError(result.message);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[30rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">Mot de passe oublié</h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          <TextLink to="/login">Retour à la connexion</TextLink>
        </p>
        {done ? (
          <Banner variant="success" role="status">
            Si cette adresse est associée à un compte, vous recevrez un e-mail avec un lien pour
            choisir un nouveau mot de passe.
          </Banner>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <InputField
              id="forgot-email"
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={submitting}
            />
            {error ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer le lien'}
            </Button>
          </form>
        )}
      </Card>
    </PageSection>
  );
}
