import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import type { UserProfile } from './types';

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  userEmail: string | null;
  profile: UserProfile | null;
  displayLabel: string | null;
  profileLoading: boolean;
  loading: boolean;
  configError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
