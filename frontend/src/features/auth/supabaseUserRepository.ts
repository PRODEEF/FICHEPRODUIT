import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import type { UserProfile } from './types';
import type { UserRepository } from './userRepository';

/** Colonnes SQL `public.users` ; `display_name` est exposé comme `username` dans `UserProfile`. */
const USER_COLUMNS = 'display_name, website_url, pending_auto_analyze';

const userProfileRowSchema = z.object({
  display_name: z.string().nullable(),
  website_url: z.string().nullable(),
  pending_auto_analyze: z.boolean().nullable(),
});

export function createSupabaseUserRepository(client: SupabaseClient): UserRepository {
  return {
    async getProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await client
        .from('users')
        .select(USER_COLUMNS)
        .eq('id', userId)
        .maybeSingle();
      if (error || data == null) return null;
      const parsed = userProfileRowSchema.safeParse(data);
      if (!parsed.success) return null;
      const row = parsed.data;
      return {
        username: row.display_name ?? 'Pseudo',
        website_url: row.website_url,
        pending_auto_analyze: Boolean(row.pending_auto_analyze),
      };
    },

    async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
      const patch: Record<string, unknown> = {};
      if (data.username !== undefined) patch['display_name'] = data.username;
      if (data.website_url !== undefined) patch['website_url'] = data.website_url;
      if (data.pending_auto_analyze !== undefined) {
        patch['pending_auto_analyze'] = data.pending_auto_analyze;
      }
      if (Object.keys(patch).length === 0) return;

      const { error } = await client.from('users').update(patch).eq('id', userId);
      if (error) throw new Error(error.message);
    },
  };
}
