/** Profil applicatif (table `public.users`). L’e-mail provient du JWT Supabase Auth. */
export type UserProfile = {
  id: string;
  username: string | null;
  websiteUrl: string | null;
  pendingAutoAnalyze: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfile = Partial<
  Pick<UserProfile, "username" | "websiteUrl" | "pendingAutoAnalyze">
>;
