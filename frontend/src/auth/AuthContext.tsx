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

export type AuthContextValue = {
  session: Session | null
  user: User | null
  userEmail: string | null
  loading: boolean
  configError: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)

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

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
  }, [])

  const userEmail = user?.email ?? null

  const value = useMemo(
    () => ({
      session,
      user,
      userEmail,
      loading,
      configError,
      signOut,
    }),
    [session, user, userEmail, loading, configError, signOut],
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
