import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { isEmailVerified } from './emailVerification';

function mockUser(overrides: Partial<User>): User {
  return {
    id: overrides.id ?? '1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    ...overrides,
  };
}

describe('isEmailVerified', () => {
  it('retourne false si user est null', () => {
    expect(isEmailVerified(null)).toBe(false);
  });

  it('retourne false si user est undefined', () => {
    expect(isEmailVerified(undefined)).toBe(false);
  });

  it('retourne false si email_confirmed_at est absent', () => {
    expect(isEmailVerified(mockUser({}))).toBe(false);
  });

  it('retourne false si email_confirmed_at est une chaîne vide', () => {
    expect(isEmailVerified(mockUser({ email_confirmed_at: '' }))).toBe(false);
  });

  it('retourne true si email_confirmed_at contient un timestamp', () => {
    expect(isEmailVerified(mockUser({ email_confirmed_at: '2026-01-01T00:00:00Z' }))).toBe(true);
  });
});
