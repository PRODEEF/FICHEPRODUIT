import type { SupabaseClient } from '@supabase/supabase-js';

import type { UserProfile } from './types';
import type { UserRepository } from './userRepository';

const PROFILE_COLUMNS = 'username, website_url, pending_auto_analyze';

export function createSupabaseUserRepository(client: SupabaseClient): UserRepository {
  return {
    async getProfile(userId: string): Promise<UserProfile | null> {
      const { data, error } = await client
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        username: data.username,
        website_url: data.website_url,
        pending_auto_analyze: Boolean(data.pending_auto_analyze),
      };
    },

    async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (data.username !== undefined) patch.username = data.username;
      if (data.website_url !== undefined) patch.website_url = data.website_url;
      if (data.pending_auto_analyze !== undefined) {
        patch.pending_auto_analyze = data.pending_auto_analyze;
      }
      const { error } = await client.from('profiles').update(patch).eq('id', userId);
      if (error) throw new Error(error.message);
    },
  };
}
