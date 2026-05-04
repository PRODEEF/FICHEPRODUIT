import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { PasswordField } from '../components/PasswordField';
import { getSupabaseClient } from '../../../lib/supabase';
import { validatePasswordMatch, validatePasswordMinLength } from '../lib/signupFieldValidation';
import { updatePasswordAndSignOut } from '../lib/passwordAuth';
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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Nouveau mot de passe</h1>
        {gate === 'loading' ? (
          <p className="auth-intro" aria-busy="true">
            Vérification du lien…
          </p>
        ) : null}
        {gate === 'invalid' ? (
          <>
            <p className="auth-banner auth-banner--error" role="alert">
              Ce lien de réinitialisation est invalide ou expiré. Demande un nouveau lien depuis la
              page de connexion.
            </p>
            <p className="auth-footer-link">
              <Link to="/forgot-password" className="auth-inline-link">
                Renvoyer un lien
              </Link>
              {' · '}
              <Link to="/login" className="auth-inline-link">
                Connexion
              </Link>
            </p>
          </>
        ) : null}
        {gate === 'ready' ? (
          <form className="auth-form" onSubmit={(e) => void handleSubmit(e)}>
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
              <p className="auth-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn-auth-primary" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
