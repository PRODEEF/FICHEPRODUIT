import { isValidGuestSessionId } from '@lib/analysis/analysisStorage';

/**
 * Lien d'inscription depuis le catalogue public invité (`url` + session `s`).
 */
export function buildSignupHref(websiteUrl: string, guestSessionId?: string | null): string {
  const params = new URLSearchParams();
  const trimmedUrl = websiteUrl.trim();
  if (trimmedUrl !== '') {
    params.set('url', trimmedUrl);
  }
  if (isValidGuestSessionId(guestSessionId)) {
    params.set('s', guestSessionId);
  }
  return params.size > 0 ? `/signup?${params.toString()}` : '/signup';
}
