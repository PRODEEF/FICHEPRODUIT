import { use } from 'react';

import { AuthContext, type AuthContextValue } from '@shared/auth/auth-context';

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
