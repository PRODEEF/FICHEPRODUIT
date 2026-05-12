export type AuthenticatedUser = {
  id: string; // UUID Supabase
  email: string;
  accessToken: string; // Passé aux Repositories pour scoper le client Supabase
};
