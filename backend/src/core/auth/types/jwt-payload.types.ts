export type AuthenticatedUser = {
  id: string; // UUID Supabase
  email: string;
  accessToken: string; // Passé aux Repositories pour scoper le client Supabase
  /** ISO timestamp Supabase (`auth.users.email_confirmed_at`) ou `null` si e-mail non confirmé. */
  emailConfirmedAt: string | null;
};
