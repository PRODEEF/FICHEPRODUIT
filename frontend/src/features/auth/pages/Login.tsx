import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { getSupabaseClient } from '@lib/supabase';
import { parseZodFieldErrors } from '@lib/parseZodErrors';

import { PasswordField } from '../components/PasswordField';
import { useAuth } from '../useAuth';
import { loginSchema } from '../lib/authSchemas';
import { signInWithEmailPassword } from '../lib/credentialsAuth';
import type { LoginFieldErrors, LoginFieldKey } from '../types';

export function Login() {
  const navigate = useNavigate();
  const { userEmail, loading: authLoading, configError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailErrorId = 'login-email-error';

  useEffect(() => {
    if (authLoading || configError) return;
    if (userEmail) navigate('/', { replace: true });
  }, [authLoading, userEmail, configError, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(parseZodFieldErrors<LoginFieldKey>(result.error));
      return;
    }

    const { email: emailTrim, password: passwordVal } = result.data;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Configuration Supabase manquante. Vérifie le fichier .env du frontend.');
      return;
    }
    setSubmitting(true);
    try {
      const authResult = await signInWithEmailPassword(supabase, emailTrim, passwordVal);
      if (authResult.ok === false) {
        const code = authResult.code?.toLowerCase() ?? '';
        if (code === 'email_not_confirmed') {
          setFieldErrors({ email: authResult.message });
        } else if (code === 'invalid_credentials' || code === 'invalid_grant') {
          setFieldErrors({ password: authResult.message });
        } else {
          setFieldErrors({});
          setFormError(authResult.message);
        }
        return;
      }
      navigate('/', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  function clearEmailError() {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
    setFormError(null);
  }

  function clearPasswordError() {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.password;
      return next;
    });
    setFormError(null);
  }

  if (configError) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Connexion</h1>
          <p className="auth-banner auth-banner--error">
            Variables d’environnement Supabase manquantes. Copie{' '}
            <code className="auth-code">frontend/.env.example</code> vers{' '}
            <code className="auth-code">frontend/.env</code> et renseigne l’URL ainsi que la clé
            anonyme.
          </p>
        </div>
      </div>
    );
  }

  const emailErr = fieldErrors.email;
  const passwordErr = fieldErrors.password;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p className="auth-intro">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="auth-inline-link">
            Créer un compte
          </Link>
        </p>
        <form className="auth-form" noValidate onSubmit={(e) => void handleSubmit(e)}>
          <div className="auth-field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              aria-required="true"
              aria-invalid={Boolean(emailErr)}
              aria-describedby={emailErr ? emailErrorId : undefined}
              value={email}
              onChange={(ev) => {
                setEmail(ev.target.value);
                clearEmailError();
              }}
              disabled={submitting || authLoading}
            />
            {emailErr ? (
              <p id={emailErrorId} className="auth-error" role="alert">
                {emailErr}
              </p>
            ) : null}
          </div>
          <PasswordField
            id="login-password"
            label="Mot de passe"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={passwordErr}
            onChange={(ev) => {
              setPassword(ev.target.value);
              clearPasswordError();
            }}
            disabled={submitting || authLoading}
          />
          {formError ? (
            <p className="auth-error" role="alert">
              {formError}
            </p>
          ) : null}
          <button type="submit" className="btn-auth-primary" disabled={submitting || authLoading}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-footer-link">
          <Link to="/forgot-password" className="auth-inline-link">
            Mot de passe oublié ?
          </Link>
        </p>
      </div>
    </div>
  );
}
