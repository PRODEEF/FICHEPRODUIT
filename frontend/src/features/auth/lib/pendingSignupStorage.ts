import type { User } from '@supabase/supabase-js';

import type { UserRepository } from '../userRepository';

/**
 * Filet de secours si la session s’ouvre dans le même onglet avant que le trigger DB ne soit visible.
 * Le signup envoie `website_url` / `pending_auto_analyze` dans `user_metadata` (trigger `handle_new_auth_user`).
 */
export interface PendingSignupPayload {
  email?: string;
  phone?: string;
  username: string;
  websiteUrl: string;
  pendingAutoAnalyze: boolean;
}

let pendingSignupMemory: PendingSignupPayload | null = null;

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
  pendingSignupMemory = payload;
}

function readPendingSignup(): PendingSignupPayload | null {
  return pendingSignupMemory;
}

function clearPendingSignupMemory(): void {
  pendingSignupMemory = null;
}

/** Applique l’intent de signup à `public.users` une fois la session Supabase disponible ; retourne si un PATCH a été exécuté. */
export async function applyPendingSignupFromStorage(
  repo: UserRepository,
  user: User,
): Promise<boolean> {
  const pending = readPendingSignup();
  if (!pending || !payloadMatchesUser(pending, user)) return false;

  const existing = await repo.getProfile(user.id);
  const needsUsername =
    !existing?.username || existing.username === 'Pseudo' || existing.username.trim() === '';
  const needsWebsite = pending.websiteUrl && !existing?.website_url;
  const needsPendingFlag =
    pending.pendingAutoAnalyze && existing && !existing.pending_auto_analyze;
  if (!needsUsername && !needsWebsite && !needsPendingFlag) {
    clearPendingSignupMemory();
    return false;
  }

  try {
    const patch: Parameters<UserRepository['updateProfile']>[1] = {};
    if (needsUsername) patch.username = pending.username;
    if (needsWebsite) patch.website_url = pending.websiteUrl;
    if (needsPendingFlag) patch.pending_auto_analyze = pending.pendingAutoAnalyze;
    await repo.updateProfile(user.id, patch);
    clearPendingSignupMemory();
    return true;
  } catch {
    return false;
  }
}
