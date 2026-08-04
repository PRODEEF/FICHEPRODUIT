// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateCheckoutSession } = vi.hoisted(() => ({
  mockCreateCheckoutSession: vi.fn(),
}));

vi.mock('@api/billing', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
}));

import { ApiError } from '@api/apiError';

import { startPlanCheckout } from './checkout';

describe('startPlanCheckout', () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { assign: assignMock },
      writable: true,
    });
  });

  it('redirige vers Stripe en cas de succès', async () => {
    mockCreateCheckoutSession.mockResolvedValue({ url: 'https://checkout.stripe.test' });

    const result = await startPlanCheckout('starter', 'Glisse');

    expect(result).toEqual({ ok: true });
    expect(assignMock).toHaveBeenCalledWith('https://checkout.stripe.test');
  });

  it('retourne needsAuth sur HTTP 401', async () => {
    mockCreateCheckoutSession.mockRejectedValue(new ApiError(401, 'Non autorisé'));

    const result = await startPlanCheckout('starter', 'Glisse');

    expect(result).toEqual({
      ok: false,
      needsAuth: true,
      message: 'Connecte-toi pour acheter des crédits.',
    });
  });
});
