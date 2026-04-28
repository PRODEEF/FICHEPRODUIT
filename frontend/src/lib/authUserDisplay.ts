/**
 * Supabase Auth dashboard shows "Display name" from `user_metadata.full_name`.
 * We keep `username` in sync for app code and triggers.
 */
export function authMetadataForDisplayName(displayName: string): {
  username: string
  full_name: string
} {
  return { username: displayName, full_name: displayName }
}
