import { z } from 'zod';

import { parseAsFullSiteUrl } from '@lib/siteUrl';
import { SHOP_SECTOR_LABELS } from '@shared/lib/shopSectors';

import {
  getPasswordStrengthSnapshot,
  SIGNUP_PASSWORD_COMPLEXITY_MESSAGE,
} from './passwordStrength';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const PASSWORD_MIN = 8;

/** Alias historique pour la longueur minimale du mot de passe. */
export const MIN_PASSWORD_LENGTH = PASSWORD_MIN;

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
  .email('Format d’e-mail invalide.')
  .trim()
  .min(1, 'Veuillez entrer une adresse e-mail.');

/** Inscription : un seul message d’erreur (4 critères sur 5, dont la longueur). */
const signupPasswordField = z.string().superRefine((val, ctx) => {
  if (getPasswordStrengthSnapshot(val, PASSWORD_MIN).isAcceptable) return;
  ctx.addIssue({
    code: 'custom',
    message: SIGNUP_PASSWORD_COMPLEXITY_MESSAGE,
  });
});

/** Chaîne vide acceptée ou URL complète canonique (`parseAsFullSiteUrl`, pas de domaine seul). */
const websiteUrlField = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v === '' || parseAsFullSiteUrl(v) !== null, WEBSITE_URL_INVALID_MESSAGE)
  .transform((v) => {
    if (v === '') return '';
    const parsed = parseAsFullSiteUrl(v);
    if (parsed === null) {
      throw new Error('Invariant Zod : URL invalide après refine.');
    }
    return parsed;
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Indiquez votre mot de passe.'),
});

export const signupSchema = z
  .object({
    email: emailField,
    username: usernameField,
    sector: z
      .string()
      .min(1, "Veuillez choisir votre secteur d'activité.")
      .pipe(
        z.enum(SHOP_SECTOR_LABELS, {
          message: "Veuillez choisir votre secteur d'activité.",
        }),
      ),
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
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: signupPasswordField,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['passwordConfirm'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Indiquez votre mot de passe actuel.'),
    newPassword: signupPasswordField,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['passwordConfirm'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Le nouveau mot de passe doit être différent de l’ancien.',
    path: ['newPassword'],
  });

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export type LoginPayload = z.output<typeof loginSchema>;
export type SignupPayload = z.output<typeof signupSchema>;
export type ProfilePayload = z.output<typeof profileSchema>;
export type ForgotPasswordPayload = z.output<typeof forgotPasswordSchema>;
export type ResetPasswordPayload = z.output<typeof resetPasswordSchema>;
export type ChangePasswordPayload = z.output<typeof changePasswordSchema>;

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
