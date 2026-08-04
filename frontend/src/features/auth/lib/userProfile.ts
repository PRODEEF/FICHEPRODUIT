import type { User } from '@supabase/supabase-js';

import { apiErrorMessage } from '@lib/apiErrorMessage';
import { getSupabaseClient } from '@shared/supabase';

import type { ProfilePayload } from './authSchemas';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import type { UserRepository } from '../userRepository';

export type SaveProfileResult = { ok: true } | { ok: false; message: string };

export async function saveUserProfile(
  repo: UserRepository,
  user: User,
  form: ProfilePayload,
): Promise<SaveProfileResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Configuration Supabase manquante.' };
  }

  try {
    await repo.updateProfile(user.id, {
      username: form.username,
    });

    const { error: authError } = await client.auth.updateUser({
      data: {
        display_name: form.username,
        full_name: form.username,
      },
    });
    if (authError) {
      return {
        ok: false,
        message:
          authError.message.trim() ||
          'Le profil a été enregistré mais la mise à jour du compte Auth a échoué. Réessayez.',
      };
    }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err, 'Enregistrement impossible. Réessayez.') };
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
