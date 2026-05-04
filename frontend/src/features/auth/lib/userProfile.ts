import type { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../../lib/supabase';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import type { UserRepository } from '../userRepository';
import { validateUsernameForAuth, parseOptionalWebsiteUrl } from './signupFieldValidation';

export type ProfileFormInput = {
  usernameRaw: string;
  websiteUrlRaw: string;
};

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; message: string };

const WEBSITE_ERROR =
  'URL du site invalide. Indique une adresse complète (https://…) ou un domaine (ex. monsite.fr).';

/**
 * Persists profile fields via `profiles` only (no Supabase Auth metadata).
 */
export async function saveUserProfile(
  repo: UserRepository,
  user: User,
  form: ProfileFormInput,
): Promise<SaveProfileResult> {
  const userCheck = validateUsernameForAuth(form.usernameRaw);
  if (userCheck.ok == false) return { ok: false, message: userCheck.message };

  const site = parseOptionalWebsiteUrl(form.websiteUrlRaw, WEBSITE_ERROR);
  if (site.ok == false) return { ok: false, message: site.message };

  const website_url = site.website_url === '' ? null : site.website_url;

  try {
    await repo.updateProfile(user.id, {
      username: userCheck.normalized,
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
