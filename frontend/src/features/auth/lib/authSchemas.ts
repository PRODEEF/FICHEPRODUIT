import { z } from 'zod';

import { parseAsFullSiteUrl } from '@lib/utils/siteUrl';

import {
  getPasswordStrengthSnapshot,
  SIGNUP_PASSWORD_COMPLEXITY_MESSAGE,
} from './passwordStrength';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const PASSWORD_MIN = 8;

const USERNAME_REGEX = /^[a-zA-Z0-9_\- ]+$/;

const WEBSITE_URL_INVALID_MESSAGE =
  'URL du site invalide. Indiquez une adresse complète (ex. https://monsite.fr).';

const usernameField = z
  .string()
  .trim()
  .min(
    USERNAME_MIN_LENGTH,
    `Le nom d’utilisateur doit contenir au moins ${USERNAME_MIN_LENGTH} caractères.`,
  )
  .max(
    USERNAME_MAX_LENGTH,
    `Le nom d’utilisateur ne peut pas dépasser ${USERNAME_MAX_LENGTH} caractères.`,
  )
  .regex(
    USERNAME_REGEX,
    'Utilisez uniquement des lettres, des chiffres, des espaces, des tirets et des underscores.',
  );

const emailField = z
  .string()
  .trim()
  .min(1, 'Veuillez entrer une adresse e-mail.')
  .email('Format d’e-mail invalide.');

/** Inscription : un seul message d’erreur (4 critères sur 5, dont la longueur). */
const signupPasswordField = z.string().superRefine((val, ctx) => {
  if (getPasswordStrengthSnapshot(val, PASSWORD_MIN).isAcceptable) return;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: SIGNUP_PASSWORD_COMPLEXITY_MESSAGE,
  });
});

/** Chaîne vide acceptée ou URL complète canonique (`parseAsFullSiteUrl`, pas de domaine seul). */
const websiteUrlField = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === '' || parseAsFullSiteUrl(v) !== null, WEBSITE_URL_INVALID_MESSAGE)
  .transform((v) => (v === '' ? '' : parseAsFullSiteUrl(v)!));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Indiquez votre mot de passe.'),
});

export const signupSchema = z
  .object({
    email: emailField,
    username: usernameField,
    websiteUrl: websiteUrlField,
    password: signupPasswordField,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['passwordConfirm'],
  });

export const profileSchema = z.object({
  username: usernameField,
  websiteUrl: websiteUrlField,
});

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
export type ProfileInput = z.input<typeof profileSchema>;

export type LoginPayload = z.output<typeof loginSchema>;
export type SignupPayload = z.output<typeof signupSchema>;
export type ProfilePayload = z.output<typeof profileSchema>;

export function validatePasswordMinLength(
  password: string,
  minLength = PASSWORD_MIN,
): string | null {
  const r = z
    .string()
    .min(minLength, `Le mot de passe doit contenir au moins ${minLength} caractères.`)
    .safeParse(password);
  if (r.success) return null;
  return r.error.issues[0]?.message ?? null;
}
