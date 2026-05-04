import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient } from '@lib/supabase';

import { AuthContext } from './auth-context';
import { applyPendingSignupFromStorage } from './lib/pendingSignupStorage';
import { createSupabaseUserRepository } from './supabaseUserRepository';
import type { UserProfile } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setConfigError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (cancelled) return;
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    let cancelled = false;
    const repo = createSupabaseUserRepository(supabase);
    void (async () => {
      try {
        await applyPendingSignupFromStorage(repo, user);
      } finally {
        const next = await repo.getProfile(user.id);
        if (!cancelled) {
          setProfile(next);
          setProfileLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const repo = createSupabaseUserRepository(supabase);
    const next = await repo.getProfile(user.id);
    setProfile(next);
  }, [user]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  const userEmail = user?.email ?? null;

  const displayLabel = useMemo(
    () => (user ? (profile?.username ?? userEmail ?? null) : null),
    [user, profile, userEmail],
  );

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
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
