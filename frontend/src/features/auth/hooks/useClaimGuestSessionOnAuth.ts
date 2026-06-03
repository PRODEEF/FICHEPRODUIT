import { useEffect, useRef } from 'react';

import type { Session } from '@supabase/supabase-js';

import { claimGuestSessionIfPresent } from '../lib/claimGuestSessionIfPresent';

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

    void (async () => {
      const claimed = await claimGuestSessionIfPresent(session.access_token);
      if (claimed) claimedForUserIdRef.current = userId;
    })();
  }, [session, authLoading]);

  useEffect(() => {
    if (!session?.user?.id) {
      claimedForUserIdRef.current = null;
    }
  }, [session?.user?.id]);
}
