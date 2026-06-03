import { beforeEach, describe, expect, it, vi } from 'vitest';

const GUEST_SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';

const { mockApiFetch, mockGuestHeaders, mockResolveForClaim } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockGuestHeaders: vi.fn(),
  mockResolveForClaim: vi.fn<(explicit?: string | null) => string | null>(),
}));

vi.mock('@lib/analysis/guestSessionStorage', () => ({
  resolveGuestSessionIdForClaim: (explicit?: string | null) => mockResolveForClaim(explicit),
}));

vi.mock('./apiBase', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

vi.mock('./apiAuth', () => ({
  apiFetch: mockApiFetch,
  guestOrAuthHeadersWithGuestSession: mockGuestHeaders,
  ApiHttpError: class ApiHttpError extends Error {
    readonly status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiHttpError';
      this.status = status;
    }
  },
}));

import { claimGuestSession } from './user';
import { ApiHttpError } from './apiAuth';

describe('claimGuestSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveForClaim.mockReturnValue(null);
    mockApiFetch.mockResolvedValue({ res: new Response(), parsed: {} });
    mockGuestHeaders.mockResolvedValue({
      'Content-Type': 'application/json',
      'x-session-id': GUEST_SESSION_ID,
    });
  });

  it('envoie sessionId dans le body et l’en-tête x-session-id quand une session est résolue', async () => {
    mockResolveForClaim.mockReturnValue(GUEST_SESSION_ID);

    await claimGuestSession({ sessionId: GUEST_SESSION_ID, accessToken: 'jwt-test' });

    expect(mockGuestHeaders).toHaveBeenCalledWith(GUEST_SESSION_ID, 'jwt-test');
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://api.test/api/users/me/claim-guest-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sessionId: GUEST_SESSION_ID }),
      }),
    );
  });

  it('envoie un body vide sans session invité', async () => {
    await claimGuestSession();

    expect(mockGuestHeaders).toHaveBeenCalledWith(null, undefined);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://api.test/api/users/me/claim-guest-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });

  it('ignore silencieusement une réponse 404', async () => {
    mockResolveForClaim.mockReturnValue(GUEST_SESSION_ID);
    mockApiFetch.mockRejectedValue(new ApiHttpError('Ressource introuvable.', 404));

    await expect(
      claimGuestSession({ sessionId: GUEST_SESSION_ID, accessToken: 'jwt-test' }),
    ).resolves.toBeUndefined();
  });
});
