import { useMemo } from 'react';
import { Navigate } from 'react-router';

import { useAuth } from '@shared/hooks/useAuth';
import { Banner, Button, Card, PageSection, TextLink } from '@shared/ui';

import { useResendVerificationEmail } from '../hooks/useResendVerificationEmail';
import { peekPendingSignupEmail } from '../lib/pendingSignupStorage';

export function VerifyEmail() {
  const { userEmail, isEmailVerified, loading: authLoading } = useAuth();
  const { status, error, resend } = useResendVerificationEmail();

  // Ordre : session Supabase > mémoire d'inscription en attente (session absente juste après signup).
  const displayEmail = useMemo(() => userEmail ?? peekPendingSignupEmail(), [userEmail]);

  if (authLoading) {
    return (
      <PageSection className="max-w-2xl pt-8">
        <div
          role="status"
          aria-busy="true"
          aria-live="polite"
          className="flex min-h-[40vh] w-full flex-1 flex-col items-center justify-center gap-4"
        >
          <div
            aria-hidden
            className="h-12 w-12 animate-spin rounded-full border-3 border-soft border-t-purple-600 motion-reduce:animate-none"
          />
          <p className="text-sm text-text-secondary">Vérification de la session…</p>
        </div>
      </PageSection>
    );
  }

  // E-mail déjà confirmé → l'utilisateur n'a rien à faire ici.
  if (isEmailVerified) {
    return <Navigate to="/catalog" replace />;
  }

  const isSending = status === 'sending';
  const canResend = Boolean(displayEmail) && !isSending;

  return (
    <PageSection className="max-w-2xl pt-8">
      <Card className="mx-auto w-full max-w-[34rem]">
        <h1 className="mb-2 text-center text-2xl font-extrabold text-text-primary">
          Confirmez votre adresse e-mail
        </h1>
        <p className="mb-5 text-center text-sm text-text-secondary">
          Vous avez déjà confirmé ? <TextLink to="/login">Se connecter</TextLink>
        </p>

        <div className="flex flex-col gap-4">
          <Banner variant="neutral" role="status">
            {displayEmail ? (
              <>
                Un lien de confirmation a été envoyé à{' '}
                <strong className="font-semibold text-text-primary">{displayEmail}</strong>.
              </>
            ) : (
              <>Un lien de confirmation a été envoyé à votre adresse e-mail.</>
            )}{' '}
            Cliquez sur ce lien pour activer votre compte. Pensez à consulter vos spams si vous ne
            recevez rien après quelques minutes.
          </Banner>

          {status === 'sent' ? (
            <Banner variant="success" role="status">
              E-mail de confirmation renvoyé. Vérifiez votre messagerie (spams inclus).
            </Banner>
          ) : null}

          {status === 'error' && error ? (
            <Banner variant="error" role="alert">
              {error}
            </Banner>
          ) : null}

          <Button
            type="button"
            variant="gradient"
            disabled={!canResend}
            onClick={() => void (displayEmail ? resend(displayEmail) : undefined)}
          >
            {isSending ? 'Envoi en cours…' : 'Renvoyer l’e-mail de confirmation'}
          </Button>

          {!displayEmail ? (
            <p className="m-0 text-center text-sm text-text-secondary">
              Adresse e-mail introuvable dans cette session.{' '}
              <TextLink to="/signup">Reprendre l’inscription</TextLink>.
            </p>
          ) : null}
        </div>
      </Card>
    </PageSection>
  );
}
