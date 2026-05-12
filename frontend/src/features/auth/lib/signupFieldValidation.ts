import { parseZodFieldErrors } from '@lib/parseZodErrors';

import { signupSchema } from './authSchemas';
import type { SignupFieldErrors, SignupFieldKey, SignupValidatedPayload } from '../types';

export type { SignupFieldKey, SignupFieldErrors, SignupValidatedPayload } from '../types';
export { signupSchema } from './authSchemas';

export { validatePasswordMinLength } from './authSchemas';

export function collectSignupFieldErrors(input: {
  email: string;
  username: string;
  websiteUrl: string;
  password: string;
  passwordConfirm: string;
}): { ok: false; fieldErrors: SignupFieldErrors } | { ok: true; payload: SignupValidatedPayload } {
  const result = signupSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      fieldErrors: parseZodFieldErrors<SignupFieldKey>(result.error),
    };
  }

  const { email, username, websiteUrl } = result.data;

  return {
    ok: true,
    payload: {
      emailTrim: email,
      normalizedUsername: username,
      website_url: websiteUrl,
    },
  };
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) {
    return 'Les mots de passe ne correspondent pas.';
  }
  return null;
}
