import { useCallback, useEffect, useState } from 'react';

import { fetchBillingMe, type BillingSummary } from '@api/billing';
import { NestHttpError } from '@api/nestHttpClient';
import { useAuth } from '@shared/hooks/useAuth';

export interface UseBillingResult {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBilling(): UseBillingResult {
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

  return { summary, loading, error, refresh };
}
