import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabase'

export type UserProfile = {
  username: string
  website_url: string | null
}

export type AuthContextValue = {
  session: Session | null
  user: User | null
  userEmail: string | null
  profile: UserProfile | null
  displayLabel: string | null
  /** True while fetching `profiles` for the current user. */
  profileLoading: boolean
  loading: boolean
  configError: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = getSupabaseClient()
    if (!supabase) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('username, website_url')
      .eq('id', userId)
      .maybeSingle()
    if (error || !data) return null
    return {
      username: data.username,
      website_url: data.website_url,
    } as UserProfile
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setConfigError(true)
      setLoading(false)
      return
    }

    let cancelled = false

    void supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (cancelled) return
      setSession(next)
      setUser(next?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    let cancelled = false
    void loadProfile(user.id).then((next) => {
      if (!cancelled) {
        setProfile(next)
        setProfileLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user, loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    const next = await loadProfile(user.id)
    setProfile(next)
  }, [user, loadProfile])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
  }, [])

  const userEmail = user?.email ?? null
  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const metaFullName =
    typeof meta?.full_name === 'string' ? meta.full_name : null
  const metaUsername =
    typeof meta?.username === 'string' ? meta.username : null
  const displayLabel =
    profile?.username ??
    metaFullName ??
    metaUsername ??
    userEmail ??
    null

  const value = useMemo(
    () => ({
      session,
      user,
      userEmail,
      profile,
      displayLabel,
      profileLoading,
      loading,
      configError,
      signOut,
      refreshProfile,
    }),
    [
      session,
      user,
      userEmail,
      profile,
      displayLabel,
      profileLoading,
      loading,
      configError,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
