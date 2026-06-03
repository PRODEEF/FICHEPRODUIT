import type { AuthError, User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import {
  authErrorMessage,
  isSignupDuplicateEmailUser,
  isSignupEmailAlreadyRegisteredError,
  SIGNUP_EMAIL_ALREADY_MESSAGE,
} from './authErrorMessage';

function mockAuthError(
  partial: { message: string; status?: number; code?: string; name?: string },
): AuthError {
  const name = partial.name ?? 'AuthApiError';
  const status = partial.status ?? 400;
  return {
    name,
    message: partial.message,
    status,
    code: partial.code,
    __isAuthError: true,
    toJSON: () => ({ name, message: partial.message, status, code: partial.code }),
  } as unknown as AuthError;
}

function mockUser(overrides: Pick<User, 'identities'> & Partial<Pick<User, 'id'>>): User {
  return {
    id: overrides.id ?? '1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '',
    ...overrides,
  };
}

describe('isSignupEmailAlreadyRegisteredError', () => {
  it('détecte le code user_already_registered', () => {
    expect(
      isSignupEmailAlreadyRegisteredError(
        mockAuthError({ message: 'x', code: 'user_already_registered' }),
      ),
    ).toBe(true);
  });

  it('détecte le message anglais sans code', () => {
    expect(
      isSignupEmailAlreadyRegisteredError(
        mockAuthError({ message: 'User already registered' }),
      ),
    ).toBe(true);
  });

  it('ignore les autres erreurs', () => {
    expect(
      isSignupEmailAlreadyRegisteredError(
        mockAuthError({ message: 'Invalid login credentials', code: 'invalid_credentials' }),
      ),
    ).toBe(false);
  });
});

describe('authErrorMessage', () => {
  it('traduit User already registered', () => {
    expect(
      authErrorMessage(mockAuthError({ message: 'User already registered' })),
    ).toBe(SIGNUP_EMAIL_ALREADY_MESSAGE);
  });
});

describe('isSignupDuplicateEmailUser', () => {
  it('retourne true si identities est vide', () => {
    expect(isSignupDuplicateEmailUser(mockUser({ identities: [] }))).toBe(true);
  });

  it('retourne false si au moins une identity', () => {
    expect(
      isSignupDuplicateEmailUser(
        mockUser({
          identities: [
            {
              id: 'i1',
              identity_id: 'i1',
              user_id: '1',
              identity_data: {},
              provider: 'email',
              created_at: '',
              last_sign_in_at: '',
              updated_at: '',
            },
          ],
        }),
      ),
    ).toBe(false);
  });
});
