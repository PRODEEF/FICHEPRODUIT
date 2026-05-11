import { useEffect, useRef } from 'react';

import { useAuth } from '@shared/hooks/useAuth';
import { clearPendingAutoAnalyzeForUser } from '../lib/userProfile';

interface UseSignupAutoAnalyzeParams {
  runAnalysis: (url: string) => Promise<unknown>;
}

/**
 * Lance une analyse automatique après inscription lorsque le profil porte encore le drapeau
 * `pending_auto_analyze`, puis purge ce drapeau côté API.
 */
export function useSignupAutoAnalyze({ runAnalysis }: UseSignupAutoAnalyzeParams) {
  const { user, profile, profileLoading, loading: authLoading } = useAuth();
  const signupAutoTriggeredRef = useRef(false);

  useEffect(() => {
    signupAutoTriggeredRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading || profileLoading || !user || signupAutoTriggeredRef.current) return;
    if (!profile?.pending_auto_analyze) return;

    const rawUrl = profile.website_url?.trim() ?? '';

    signupAutoTriggeredRef.current = true;

    if (!rawUrl) {
      void clearPendingAutoAnalyzeForUser(user.id);
      return;
    }

    void (async () => {
      try {
        await runAnalysis(rawUrl);
      } finally {
        await clearPendingAutoAnalyzeForUser(user.id);
      }
    })();
  }, [authLoading, profileLoading, user, profile, runAnalysis]);
}
