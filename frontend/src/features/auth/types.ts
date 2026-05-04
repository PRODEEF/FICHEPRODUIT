export type UserProfile = {
  username: string;
  website_url: string | null;
  pending_auto_analyze: boolean;
};

export type PasswordRecoveryGateState = 'loading' | 'ready' | 'invalid';

// Champs pour la connexion
export type LoginFieldKey = 'email' | 'password';
export type LoginFieldErrors = Partial<Record<LoginFieldKey, string>>;

// Champs pour l'inscription
export type SignupFieldKey = 'email' | 'username' | 'websiteUrl' | 'password' | 'passwordConfirm';
export type SignupFieldErrors = Partial<Record<SignupFieldKey, string>>;
export type SignupValidatedPayload = {
  emailTrim: string;
  normalizedUsername: string;
  website_url: string;
};
