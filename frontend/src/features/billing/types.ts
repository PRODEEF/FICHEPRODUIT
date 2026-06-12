import type { BillingSummary } from '@api/billing';

export interface BillingContextValue {
  summary: BillingSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
