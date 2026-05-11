import type { User } from '@supabase/supabase-js';

import type { UserRepository } from '../userRepository';

/**
 * Intent de profil après inscription (sans localStorage) : conservé en mémoire pour l’onglet courant.
 */
export type PendingSignupPayload = {
  email?: string;
  phone?: string;
  username: string;
  websiteUrl: string;
  pendingAutoAnalyze: boolean;
};

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
  try {
    await repo.updateProfile(user.id, {
      username: pending.username,
      website_url: pending.websiteUrl ? pending.websiteUrl : null,
      pending_auto_analyze: pending.pendingAutoAnalyze,
    });
    clearPendingSignupMemory();
    return true;
  } catch {
    return false;
  }
}
