import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { getSupabaseClient } from '@shared/supabase';

import { authErrorMessage } from '../lib/authErrorMessage';

export type ResendVerificationEmailStatus = 'idle' | 'sending' | 'sent' | 'error';

export interface UseResendVerificationEmailResult {
  status: ResendVerificationEmailStatus;
  error: string | null;
  /** Renvoie un e-mail de confirmation Supabase. `email` requis (session absente si non confirmée). */
  resend: (email: string) => Promise<void>;
}

/**
 * Renvoie un e-mail de confirmation d’inscription via `supabase.auth.resend`.
 *
 * - Utilise `type: 'signup'` pour un e-mail de première confirmation.
 * - `emailRedirectTo` pointe sur `/catalog` afin d’envoyer directement l’utilisateur sur son
 *   catalogue une fois le lien cliqué (comme lors du signup initial).
 * - Les erreurs Supabase (rate limit, adresse invalide, etc.) passent par `authErrorMessage`
 *   pour un message uniforme, et un toast d’erreur ou de succès est affiché.
 */
export function useResendVerificationEmail(): UseResendVerificationEmailResult {
  const [status, setStatus] = useState<ResendVerificationEmailStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const resend = useCallback(async (email: string): Promise<void> => {
    const target = email.trim();
    if (!target) {
      const message = 'Adresse e-mail introuvable. Reprenez l’inscription depuis le début.';
      setError(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      const message = 'Configuration Supabase manquante.';
      setError(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    setStatus('sending');
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: {
        emailRedirectTo: `${window.location.origin}/catalog`,
      },
    });

    if (resendError) {
      const message = authErrorMessage(resendError);
      setError(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    setStatus('sent');
    toast.success('E-mail de confirmation renvoyé. Pensez à vérifier vos spams.');
  }, []);

  return { status, error, resend };
}
