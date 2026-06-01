import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import { signInWithEmailPassword } from './credentialsAuth';

describe('signInWithEmailPassword', () => {
  it('retourne ok: true sans erreur', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { signInWithPassword } } as unknown as SupabaseClient;

    const result = await signInWithEmailPassword(supabase, ' user@example.com ', 'secret');

    expect(result).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret',
    });
  });

  it('retourne message et code en cas d’erreur', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const supabase = { auth: { signInWithPassword } } as unknown as SupabaseClient;

    const result = await signInWithEmailPassword(supabase, 'user@example.com', 'wrong');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_credentials');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });
});
