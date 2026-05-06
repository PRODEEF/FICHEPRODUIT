import type { User } from '@supabase/supabase-js';

import { getSupabaseClient } from '@lib/api/supabase';

import type { ProfilePayload } from './authSchemas';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import type { UserRepository } from '../userRepository';

export type SaveProfileResult = { ok: true } | { ok: false; message: string };

/**
 * Persists profile fields via `profiles` only (no Supabase Auth metadata).
 * `form` must already match `profileSchema` (validated in the UI).
 */
export async function saveUserProfile(
  repo: UserRepository,
  user: User,
  form: ProfilePayload,
): Promise<SaveProfileResult> {
  const website_url = form.websiteUrl === '' ? null : form.websiteUrl;

  try {
    await repo.updateProfile(user.id, {
      username: form.username,
      website_url,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'Enregistrement impossible. Réessaie.';
    return { ok: false, message };
  }

  return { ok: true };
}

export async function clearPendingAutoAnalyzeForUser(userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const repo = createSupabaseUserRepository(client);
  try {
    await repo.updateProfile(userId, { pending_auto_analyze: false });
  } catch {
    /* ignore: avoid blocking UX on landing */
  }
}
