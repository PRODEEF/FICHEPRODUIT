import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  changePasswordWithVerification,
  completePasswordRecovery,
  getPasswordResetRedirectUrl,
  requestPasswordResetEmail,
  updatePassword,
  updatePasswordAndSignOut,
} from './passwordAuth';

describe('getPasswordResetRedirectUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('utilise VITE_SITE_URL sans slash final', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://app.example.com/');
    expect(getPasswordResetRedirectUrl()).toBe('https://app.example.com/auth/reset-password');
  });

  it('utilise window.location.origin si VITE_SITE_URL est vide', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    expect(getPasswordResetRedirectUrl()).toBe('http://localhost:5173/auth/reset-password');
  });
});

describe('requestPasswordResetEmail', () => {
  it('appelle resetPasswordForEmail avec e-mail trimé et redirectTo', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: { resetPasswordForEmail },
    } as unknown as SupabaseClient;

    const result = await requestPasswordResetEmail(
      supabase,
      ' user@example.com ',
      'https://app.example.com/auth/reset-password',
    );

    expect(result).toEqual({ ok: true });
    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: 'https://app.example.com/auth/reset-password',
    });
  });

  it('retourne un message en cas d’erreur Supabase', async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({
      error: { code: 'over_request_rate_limit', message: 'rate limited' },
    });
    const supabase = {
      auth: { resetPasswordForEmail },
    } as unknown as SupabaseClient;

    const result = await requestPasswordResetEmail(
      supabase,
      'user@example.com',
      'https://app.example.com/auth/reset-password',
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Trop de tentatives');
    }
  });
});

describe('updatePassword', () => {
  it('appelle updateUser avec le nouveau mot de passe', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { updateUser } } as unknown as SupabaseClient;

    const result = await updatePassword(supabase, 'NewP@ssw0rd!');

    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: 'NewP@ssw0rd!' });
  });
});

describe('changePasswordWithVerification', () => {
  it('vérifie l’ancien mot de passe puis met à jour', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      auth: { signInWithPassword, updateUser },
    } as unknown as SupabaseClient;

    const result = await changePasswordWithVerification(
      supabase,
      ' user@example.com ',
      'old-pass',
      'NewP@ssw0rd!',
    );

    expect(result).toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'old-pass',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'NewP@ssw0rd!' });
  });

  it('retourne un message dédié si le mot de passe actuel est incorrect', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    const updateUser = vi.fn();
    const supabase = {
      auth: { signInWithPassword, updateUser },
    } as unknown as SupabaseClient;

    const result = await changePasswordWithVerification(
      supabase,
      'user@example.com',
      'wrong-pass',
      'NewP@ssw0rd!',
    );

    expect(result).toEqual({ ok: false, message: 'Mot de passe actuel incorrect.' });
    expect(updateUser).not.toHaveBeenCalled();
  });
});

describe('completePasswordRecovery', () => {
  it('met à jour le mot de passe sans déconnecter', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue(undefined);
    const supabase = {
      auth: { updateUser, signOut },
    } as unknown as SupabaseClient;

    const result = await completePasswordRecovery(supabase, 'NewP@ssw0rd!');

    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: 'NewP@ssw0rd!' });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('updatePasswordAndSignOut', () => {
  it('met à jour le mot de passe puis déconnecte', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const signOut = vi.fn().mockResolvedValue(undefined);
    const supabase = {
      auth: { updateUser, signOut },
    } as unknown as SupabaseClient;

    const result = await updatePasswordAndSignOut(supabase, 'NewP@ssw0rd!');

    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: 'NewP@ssw0rd!' });
    expect(signOut).toHaveBeenCalled();
  });
});
