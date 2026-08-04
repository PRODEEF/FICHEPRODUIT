import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { UserProfile } from '../../features/auth/types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  userEmail: string | null;
  /** `true` uniquement lorsque `user.email_confirmed_at` est renseigné par Supabase. */
  isEmailVerified: boolean;
  profile: UserProfile | null;
  displayLabel: string | null;
  profileLoading: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
