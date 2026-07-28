import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApiFetch, mockAuthHeaders } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockAuthHeaders: vi.fn(),
}));

vi.mock('./apiBase', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

vi.mock('./apiAuth', () => ({
  apiFetch: mockApiFetch,
  authHeaders: mockAuthHeaders,
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
    mockApiFetch.mockResolvedValue({ res: new Response(), parsed: {} });
    mockAuthHeaders.mockResolvedValue({ 'Content-Type': 'application/json' });
  });

  it('envoie un body vide et utilise authHeaders sans accessToken', async () => {
    await claimGuestSession();

    expect(mockAuthHeaders).toHaveBeenCalledWith(undefined);
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://api.test/api/users/me/claim-guest-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });

  it('transmet accessToken à authHeaders si fourni', async () => {
    await claimGuestSession({ accessToken: 'jwt-test' });

    expect(mockAuthHeaders).toHaveBeenCalledWith('jwt-test');
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://api.test/api/users/me/claim-guest-session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
  });

  it('ignore silencieusement une réponse 404', async () => {
    mockApiFetch.mockRejectedValue(new ApiHttpError('Ressource introuvable.', 404));

    await expect(claimGuestSession({ accessToken: 'jwt-test' })).resolves.toBeUndefined();
  });

  it('propage les erreurs non-404', async () => {
    mockApiFetch.mockRejectedValue(new ApiHttpError('Erreur serveur.', 500));

    await expect(claimGuestSession()).rejects.toThrow('Erreur serveur.');
  });
});
