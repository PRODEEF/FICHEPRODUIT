import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@shared/supabase';

import { AuthContext } from './auth-context';
import { applyPendingSignupFromStorage } from './lib/pendingSignupStorage';
import { createSupabaseUserRepository } from './supabaseUserRepository';
import type { UserProfile } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = getSupabaseClient() !== null;
  const configError = !supabaseConfigured;

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileBundle, setProfileBundle] = useState<{
    userId: string;
    profile: UserProfile | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(getSupabaseClient()));

  const profile =
    user && profileBundle?.userId === user.id ? profileBundle.profile : null;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const guard = { cancelled: false };

    void supabase.auth.getSession().then(({ data: { session: next } }) => {
      if (guard.cancelled) return;
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
      guard.cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    const guard = { cancelled: false };
    const repo = createSupabaseUserRepository(supabase);
    void (async () => {
      await Promise.resolve();
      setProfileLoading(true);
      try {
        await applyPendingSignupFromStorage(repo, user);
      } finally {
        const next = await repo.getProfile(user.id);
        if (!guard.cancelled) {
          setProfileBundle({ userId: user.id, profile: next });
          setProfileLoading(false);
        }
      }
    })();
    return () => {
      guard.cancelled = true;
    };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const repo = createSupabaseUserRepository(supabase);
    const next = await repo.getProfile(user.id);
    setProfileBundle({ userId: user.id, profile: next });
  }, [user]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
  }, []);

  const userEmail = user?.email ?? null;
  const meta = user?.user_metadata;
  const metadataDisplayName =
    typeof meta?.['display_name'] === 'string' ? meta['display_name'] : null;
  const metadataFullName = typeof meta?.['full_name'] === 'string' ? meta['full_name'] : null;

  const displayLabel = useMemo(() => {
    if (!user) return 'Pseudo';
    return profile?.username ?? metadataDisplayName ?? metadataFullName ?? userEmail ?? 'Pseudo';
  }, [user, profile?.username, metadataDisplayName, metadataFullName, userEmail]);

  const value = useMemo(
    () => ({
      session,
      user,
      userEmail,
      profile,
      displayLabel,
      profileLoading: Boolean(user) && profileLoading,
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

  return <AuthContext value={value}>{children}</AuthContext>;
}
