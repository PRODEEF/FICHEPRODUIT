import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { getSupabaseClient } from '@lib/api/supabase';
import { Banner, Button, Card, PageSection, TextLink } from '@shared/ui';

import { PasswordField } from '../components/PasswordField';
import { updatePasswordAndSignOut } from '../lib/passwordAuth';
import { validatePasswordMatch, validatePasswordMinLength } from '../lib/signupFieldValidation';
import type { PasswordRecoveryGateState } from '../types';

export function ResetPassword() {
  const navigate = useNavigate();
  const [gate, setGate] = useState<PasswordRecoveryGateState>('loading');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setGate('invalid');
      return;
    }

    let resolved = false;

    const finish = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      setGate(ok ? 'ready' : 'invalid');
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')
      ) {
        finish(true);
      }
    });

    const t = window.setTimeout(() => {
      if (resolved) return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        finish(Boolean(session));
      });
    }, 6000);

    return () => {
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const pwdMatch = validatePasswordMatch(password, passwordConfirm);
    if (pwdMatch) {
      setError(pwdMatch);
      return;
    }
    const pwdLen = validatePasswordMinLength(password);
    if (pwdLen) {
      setError(pwdLen);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Configuration Supabase manquante.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await updatePasswordAndSignOut(supabase, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigate('/login', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

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
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <PasswordField
              id="reset-password"
              label="Nouveau mot de passe"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={submitting}
            />
            <PasswordField
              id="reset-password-confirm"
              label="Confirmer le mot de passe"
              name="passwordConfirm"
              autoComplete="new-password"
              required
              minLength={8}
              value={passwordConfirm}
              onChange={(ev) => setPasswordConfirm(ev.target.value)}
              disabled={submitting}
            />
            {error ? (
              <p className="m-0 text-sm text-red-500" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </Button>
          </form>
        ) : null}
      </Card>
    </PageSection>
  );
}
