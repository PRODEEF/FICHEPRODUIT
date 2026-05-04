import { getSupabaseClient } from './supabase'

/** Cleared after signup auto-analysis is kicked off so the job does not run again on reload. */
export async function clearSignupAutoAnalyzeLoginFlag(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.auth.updateUser({ data: { auto_analyze_on_login: false } })
}
