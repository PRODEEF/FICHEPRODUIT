import { useEffect, useRef } from 'react';

import { claimGuestSession } from '@api/user';
import {
  clearGuestSessionId,
  getGuestSessionId,
} from '@lib/analysis/guestSessionStorage';

import type { Session } from '@supabase/supabase-js';

/**
 * Rattache les ressources invité (analyses, shop) au compte dès qu'un JWT est disponible.
 * Couvre login navbar, signup immédiat et retour après confirmation e-mail.
 */
export function useClaimGuestSessionOnAuth(session: Session | null, authLoading: boolean) {
  const claimedForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || !session?.user?.id || !session.access_token) return;
    if (claimedForUserIdRef.current === session.user.id) return;

    const userId = session.user.id;
    claimedForUserIdRef.current = userId;

    void (async () => {
      try {
        await claimGuestSession(getGuestSessionId() ?? undefined);
        clearGuestSessionId();
      } catch {
        // Pas de session invité ou erreur réseau : le parcours continue sans claim.
      }
    })();
  }, [session, authLoading]);

  useEffect(() => {
    if (!session?.user?.id) {
      claimedForUserIdRef.current = null;
    }
  }, [session?.user?.id]);
}
