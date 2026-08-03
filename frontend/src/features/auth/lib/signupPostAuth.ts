import type { SupabaseClient } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router';

import { patchMyShop } from '@api/shop';
import type { ShopSectorLabel } from '@shared/lib/shopSectors';
import type { RunAnalysisOutcome } from '@shared/hooks/useSiteAnalysis';

import { clearPendingAutoAnalyzeForUser } from './userProfile';
import { claimGuestSessionIfPresent } from './claimGuestSessionIfPresent';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

export interface SignupPostAuthInput {
  supabase: SupabaseClient;
  userId: string;
  accessToken: string;
  normalizedUsername: string;
  sector: ShopSectorLabel;
  websiteUrl: string;
  refreshProfile: () => Promise<void>;
  runAnalysis: (url: string) => Promise<RunAnalysisOutcome>;
  navigate: NavigateFunction;
}

/** Parcours après inscription avec session immédiate (email déjà confirmé). */
export async function handleSignupWithActiveSession({
  supabase,
  userId,
  accessToken,
  normalizedUsername,
  sector,
  websiteUrl,
  refreshProfile,
  runAnalysis,
  navigate,
}: SignupPostAuthInput): Promise<
  'guest_catalog' | 'analysis_started' | 'analysis_error' | 'store'
> {
  // Toujours tenter le claim — le backend lit le cookie httpOnly.
  const claimed = await claimGuestSessionIfPresent(accessToken);

  const repo = createSupabaseUserRepository(supabase);
  // Session immédiate : l'analyse (ou le claim) couvre ce parcours — ne pas laisser le
  // drapeau pour `useSignupAutoAnalyze` après navigation vers /catalog.
  await repo.updateProfile(userId, {
    username: normalizedUsername,
    website_url: websiteUrl === '' ? null : websiteUrl,
    pending_auto_analyze: false,
  });
  await patchMyShop({ sector });
  await refreshProfile();

  if (claimed) {
    void navigate('/catalog', { replace: true });
    return 'guest_catalog';
  }

  if (websiteUrl) {
    // Défensif : purger avant l'analyse pour éviter un second déclenchement sur /catalog.
    await clearPendingAutoAnalyzeForUser(userId);
    await refreshProfile();
    const outcome = await runAnalysis(websiteUrl);
    await clearPendingAutoAnalyzeForUser(userId);
    if (outcome === 'error_alert') return 'analysis_error';
    return 'analysis_started';
  }

  void navigate('/store', { replace: true });
  return 'store';
}

/** Métadonnées Auth transmises au trigger `handle_new_auth_user`. */
export function buildSignupUserMetadata(
  normalizedUsername: string,
  websiteUrl: string,
  hasGuestSession: boolean,
): Record<string, string | boolean | null> {
  return {
    display_name: normalizedUsername,
    full_name: normalizedUsername,
    website_url: websiteUrl === '' ? null : websiteUrl,
    pending_auto_analyze: hasGuestSession ? false : websiteUrl !== '',
  };
}
