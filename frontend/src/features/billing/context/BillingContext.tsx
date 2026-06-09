import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchBillingMe, type BillingSummary } from '@api/billing';
import { NestHttpError } from '@api/nestHttpClient';
import { useAuth } from '@shared/hooks/useAuth';

export interface BillingContextValue {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

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
      const message =
        err instanceof NestHttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Impossible de charger le solde crédits';
      setError(message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ summary, loading, error, refresh }),
    [summary, loading, error, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBillingContext(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error('useBillingContext doit être utilisé dans un BillingProvider');
  }
  return ctx;
}
