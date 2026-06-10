// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchBillingPlans } from '@api/billing';

import { useBillingPlans } from './useBillingPlans';

vi.mock('@api/billing', () => ({
  fetchBillingPlans: vi.fn(),
}));

const mockFetchBillingPlans = vi.mocked(fetchBillingPlans);

describe('useBillingPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge et fusionne les forfaits pour un secteur', async () => {
    mockFetchBillingPlans.mockResolvedValue({
      sector: 'Glisse',
      multiplier: 1,
      plans: [
        {
          id: 'pro',
          name: 'PRO',
          priceEur: 200,
          pricePerSheetEur: 10,
          priceSuffix: null,
          creditsLabel: '10 crédits',
          multiplier: 1,
        },
      ],
    });

    const { result } = renderHook(() => useBillingPlans('Glisse'));

    await waitFor(() => {
      expect(result.current.plansLoading).toBe(false);
    });

    expect(result.current.plans).toHaveLength(1);
    expect(result.current.plans[0]?.id).toBe('pro');
    expect(result.current.simulatorReady).toBe(true);
    expect(result.current.proPricePerSheet).toBe(10);
  });

  it('reste en chargement tant que defer est actif', async () => {
    const { result } = renderHook(() => useBillingPlans('Glisse', { defer: true }));

    expect(result.current.plansLoading).toBe(true);
    expect(mockFetchBillingPlans).not.toHaveBeenCalled();
  });

  it('expose une erreur si le chargement échoue', async () => {
    mockFetchBillingPlans.mockRejectedValue(new Error('réseau'));

    const { result } = renderHook(() => useBillingPlans('Vélo'));

    await waitFor(() => {
      expect(result.current.plansError).not.toBeNull();
    });

    expect(result.current.plans).toEqual([]);
    expect(result.current.simulatorReady).toBe(false);
  });
});
