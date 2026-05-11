import type { User } from '@supabase/supabase-js';

import { getSupabaseClient } from '../../../shared/supabase';

import type { ProfilePayload } from './authSchemas';
import { createSupabaseUserRepository } from '../supabaseUserRepository';
import type { UserRepository } from '../userRepository';

export type SaveProfileResult = { ok: true } | { ok: false; message: string };

/**
 * Enregistre le pseudo dans `public.users` puis synchronise les métadonnées Supabase Auth
 * (`display_name` / `full_name`) pour que le libellé côté Auth et le JWT suivent le changement.
 * `form` doit déjà correspondre à `profileSchema` (validé dans l’UI).
 */
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
          authError.message?.trim() ||
          'Le profil a été enregistré mais la mise à jour du compte Auth a échoué. Réessayez.',
      };
    }
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : 'Enregistrement impossible. Réessayez.';
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
