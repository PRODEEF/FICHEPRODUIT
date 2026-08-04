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
}));

import { claimGuestSession, deleteAccount } from './user';
import { ApiError } from './apiError';

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
    mockApiFetch.mockRejectedValue(new ApiError(404, 'Ressource introuvable.'));

    await expect(claimGuestSession({ accessToken: 'jwt-test' })).resolves.toBeUndefined();
  });

  it('propage les erreurs non-404', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(500, 'Erreur serveur.'));

    await expect(claimGuestSession()).rejects.toThrow('Erreur serveur.');
  });
});

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({ res: new Response(null, { status: 204 }), parsed: null });
    mockAuthHeaders.mockResolvedValue({ 'Content-Type': 'application/json' });
  });

  it('appelle DELETE /api/users/me avec le mot de passe fourni', async () => {
    await deleteAccount('super-secret');

    expect(mockAuthHeaders).toHaveBeenCalledWith();
    expect(mockApiFetch).toHaveBeenCalledWith(
      'http://api.test/api/users/me',
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ password: 'super-secret' }),
      }),
    );
  });

  it('propage une ApiError 401 (mot de passe invalide)', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(401, 'Mot de passe incorrect.'));

    await expect(deleteAccount('wrong')).rejects.toBeInstanceOf(ApiError);
    await expect(deleteAccount('wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Mot de passe incorrect.',
    });
  });

  it('propage les erreurs serveur non gérées', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(500, 'Erreur serveur.'));

    await expect(deleteAccount('any')).rejects.toThrow('Erreur serveur.');
  });
});
