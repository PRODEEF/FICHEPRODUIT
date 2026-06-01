import type { SupabaseClient } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router';

import type { RunAnalysisOutcome } from '@shared/hooks/useSiteAnalysis';

import { claimGuestSession } from '@api/user';
import { clearGuestSessionId } from '@lib/analysis/guestSessionStorage';

import { clearPendingAutoAnalyzeForUser } from './userProfile';
import { createSupabaseUserRepository } from '../supabaseUserRepository';

export type SignupPostAuthInput = {
  supabase: SupabaseClient;
  userId: string;
  normalizedUsername: string;
  websiteUrl: string;
  hasGuestSession: boolean;
  refreshProfile: () => Promise<void>;
  runAnalysis: (url: string) => Promise<RunAnalysisOutcome>;
  navigate: NavigateFunction;
};

/** Parcours après inscription avec session immédiate (email déjà confirmé). */
export async function handleSignupWithActiveSession({
  supabase,
  userId,
  normalizedUsername,
  websiteUrl,
  hasGuestSession,
  refreshProfile,
  runAnalysis,
  navigate,
}: SignupPostAuthInput): Promise<'guest_catalog' | 'analysis_started' | 'analysis_error' | 'store'> {
  const repo = createSupabaseUserRepository(supabase);
  await repo.updateProfile(userId, {
    username: normalizedUsername,
    website_url: websiteUrl === '' ? null : websiteUrl,
    pending_auto_analyze: hasGuestSession ? false : websiteUrl !== '',
  });
  await refreshProfile();

  if (hasGuestSession) {
    try {
      await claimGuestSession();
      clearGuestSessionId();
    } catch {
      // Le claim centralisé dans AuthContext peut compléter si le cookie est encore présent.
    }
    void navigate('/catalog', { replace: true });
    return 'guest_catalog';
  }

  if (websiteUrl) {
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
