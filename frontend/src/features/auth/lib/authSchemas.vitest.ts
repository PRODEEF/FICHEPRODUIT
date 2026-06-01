import { describe, expect, it } from 'vitest';

import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from './authSchemas';

describe('loginSchema', () => {
  it('accepte un e-mail et un mot de passe non vide', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(r.success).toBe(true);
  });

  it('rejette un mot de passe vide', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('rejette un e-mail invalide', () => {
    const r = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
    expect(r.success).toBe(false);
  });
});

describe('signupSchema', () => {
  const validPassword = 'Abcdef1!';

  it('rejette si les mots de passe ne correspondent pas', () => {
    const r = signupSchema.safeParse({
      email: 'user@example.com',
      username: 'Marie',
      websiteUrl: '',
      password: validPassword,
      passwordConfirm: 'other',
    });
    expect(r.success).toBe(false);
  });

  it('accepte une URL de site complète', () => {
    const r = signupSchema.safeParse({
      email: 'user@example.com',
      username: 'Marie',
      websiteUrl: 'https://example.com',
      password: validPassword,
      passwordConfirm: validPassword,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.websiteUrl).toBe('https://example.com');
    }
  });
});

describe('resetPasswordSchema', () => {
  const validPassword = 'Abcdef1!';

  it('exige la confirmation identique', () => {
    const r = resetPasswordSchema.safeParse({
      password: validPassword,
      passwordConfirm: validPassword,
    });
    expect(r.success).toBe(true);
  });
});
