import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchBillingMe, type BillingSummary } from '@api/billing';
import { apiErrorMessage } from '@lib/apiErrorMessage';
import { useAuth } from '@shared/hooks/useAuth';

import type { BillingContextValue } from '../types';

const BillingContext = createContext<BillingContextValue | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { userEmail } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userEmail) {
      setSummary(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchBillingMe();
      setSummary(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Impossible de charger le solde crédits'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    // Différé pour éviter un setState synchrone (setLoading, setError) dans le corps de l'effet
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const value = useMemo(
    () => ({ summary, loading, error, refresh }),
    [summary, loading, error, refresh],
  );

  return <BillingContext value={value}>{children}</BillingContext>;
}

export function useBillingContext(): BillingContextValue {
  const ctx = use(BillingContext);
  if (!ctx) {
    throw new Error('useBillingContext doit être utilisé dans un BillingProvider');
  }
  return ctx;
}
