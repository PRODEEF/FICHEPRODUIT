import { describe, expect, it } from 'vitest';

import { buildSignupHref } from './signupHref';

const GUEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('buildSignupHref', () => {
  it('construit le lien avec url et session invité', () => {
    expect(buildSignupHref('https://exemple.fr', GUEST_SESSION_ID)).toBe(
      `/signup?url=https%3A%2F%2Fexemple.fr&s=${GUEST_SESSION_ID}`,
    );
  });

  it('retourne /signup sans paramètres', () => {
    expect(buildSignupHref('', null)).toBe('/signup');
  });
});
