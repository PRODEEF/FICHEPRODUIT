import type { User } from '@supabase/supabase-js';
import type { UserRepository } from '../userRepository';

export const PENDING_SIGNUP_STORAGE_KEY = 'ficheproduct:pendingSignup:v1';

/**
 * Persisted locally when signup requires email/phone verification and we cannot PATCH `profiles`
 * immediately (RLS requires an authenticated user).
 */
export type PendingSignupPayload = {
  email?: string;
  phone?: string;
  username: string;
  websiteUrl: string;
  pendingAutoAnalyze: boolean;
};

function payloadMatchesUser(payload: PendingSignupPayload, user: User): boolean {
  const ue = user.email?.trim().toLowerCase();
  const pe = payload.email?.trim().toLowerCase();
  if (pe && ue && pe === ue) return true;
  const up = user.phone?.trim();
  const pp = payload.phone?.trim();
  if (pp && up && pp === up) return true;
  return false;
}

export function writePendingSignup(payload: PendingSignupPayload): void {
  try {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.setItem(PENDING_SIGNUP_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / SSR */
  }
}

function readPendingSignup(): PendingSignupPayload | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    const raw = globalThis.localStorage.getItem(PENDING_SIGNUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    const username = typeof o.username === 'string' ? o.username : '';
    const websiteUrl = typeof o.websiteUrl === 'string' ? o.websiteUrl : '';
    const pendingAutoAnalyze = typeof o.pendingAutoAnalyze === 'boolean' ? o.pendingAutoAnalyze : false;
    const email = typeof o.email === 'string' ? o.email : undefined;
    const phone = typeof o.phone === 'string' ? o.phone : undefined;
    if (!username.trim()) return null;
    return { username, websiteUrl, pendingAutoAnalyze, email, phone };
  } catch {
    return null;
  }
}

function clearPendingSignupStorage(): void {
  try {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.removeItem(PENDING_SIGNUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Applies stored signup intent to `profiles` once the user session exists; returns whether a PATCH ran. */
export async function applyPendingSignupFromStorage(
  repo: UserRepository,
  user: User,
): Promise<boolean> {
  const pending = readPendingSignup();
  if (!pending || !payloadMatchesUser(pending, user)) return false;
  try {
    await repo.updateProfile(user.id, {
      username: pending.username,
      website_url: pending.websiteUrl ? pending.websiteUrl : null,
      pending_auto_analyze: pending.pendingAutoAnalyze,
    });
    clearPendingSignupStorage();
    return true;
  } catch {
    return false;
  }
}
