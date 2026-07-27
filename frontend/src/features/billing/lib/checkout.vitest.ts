import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateCheckoutSession } = vi.hoisted(() => ({
  mockCreateCheckoutSession: vi.fn(),
}));

vi.mock('@api/billing', () => ({
  createCheckoutSession: mockCreateCheckoutSession,
}));

vi.mock('@api/nestHttpClient', () => ({
  NestHttpError: class NestHttpError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body: unknown) {
      super(message);
      this.status = status;
      this.body = body;
    }
  },
}));

import { NestHttpError } from '@api/nestHttpClient';

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
    mockCreateCheckoutSession.mockRejectedValue(new NestHttpError('Non autorisé', 401, null));

    const result = await startPlanCheckout('starter', 'Glisse');

    expect(result).toEqual({
      ok: false,
      needsAuth: true,
      message: 'Connecte-toi pour acheter des crédits.',
    });
  });
});
