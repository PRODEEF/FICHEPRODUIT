export type UserProfile = {
  username: string;
  website_url: string | null;
  pending_auto_analyze: boolean;
};

export type PasswordRecoveryGateState = 'loading' | 'ready' | 'invalid';
