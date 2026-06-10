// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePlanCheckout } from './usePlanCheckout';

const navigateMock = vi.fn();
const startPlanCheckoutMock = vi.fn();

vi.mock('react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('@shared/hooks/useAuth', () => ({
  useAuth: () => ({ userEmail: 'user@test.com' }),
}));

vi.mock('../../billing/lib/checkout', () => ({
  startPlanCheckout: (...args: unknown[]) => startPlanCheckoutMock(...args),
}));

describe('usePlanCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startPlanCheckoutMock.mockResolvedValue({ ok: true });
  });

  it('lance le checkout Stripe pour un utilisateur connecté', async () => {
    const { result } = renderHook(() => usePlanCheckout('Glisse'));

    await act(async () => {
      await result.current.handleSelectPlan('pro');
    });

    expect(startPlanCheckoutMock).toHaveBeenCalledWith('pro', 'Glisse');
    expect(result.current.checkoutLoadingPlanId).toBeNull();
  });
});
