import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequestNestJson } = vi.hoisted(() => ({
  mockRequestNestJson: vi.fn(),
}));

vi.mock('./nestHttpClient', () => ({
  requestNestJson: mockRequestNestJson,
  getSupabaseSessionAuthHeaders: vi.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test',
  }),
}));

import { createCheckoutSession, fetchBillingMe } from './billing';

describe('billing API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchBillingMe appelle GET /billing/me', async () => {
    mockRequestNestJson.mockResolvedValue({
      balance: 3,
      hasUnlimitedExports: false,
      subscription: null,
      entitlements: [],
      recentTransactions: [],
    });

    const summary = await fetchBillingMe();

    expect(summary.balance).toBe(3);
    expect(mockRequestNestJson).toHaveBeenCalledWith({
      method: 'GET',
      path: '/billing/me',
      authHeaders: expect.any(Function),
    });
  });

  it('createCheckoutSession envoie planId et sector', async () => {
    mockRequestNestJson.mockResolvedValue({ url: 'https://checkout.stripe.test/session' });

    const result = await createCheckoutSession({ planId: 'starter', sector: 'Glisse' });

    expect(result.url).toContain('stripe');
    expect(mockRequestNestJson).toHaveBeenCalledWith({
      method: 'POST',
      path: '/billing/checkout',
      body: { planId: 'starter', sector: 'Glisse' },
      authHeaders: expect.any(Function),
    });
  });
});
