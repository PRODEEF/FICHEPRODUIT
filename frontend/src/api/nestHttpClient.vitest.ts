import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@shared/supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

vi.mock('./apiBase', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

import { isApiError } from './apiError';
import { requestNestJson } from './nestHttpClient';

describe('requestNestJson', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envoie credentials include et parse le JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await requestNestJson<{ ok: boolean }>({
      method: 'GET',
      path: '/health',
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/health',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('lève ApiError quand la réponse n’est pas ok', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Interdit' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      requestNestJson({
        method: 'POST',
        path: '/shops/me',
        body: { name: 'x' },
      }),
    ).rejects.toSatisfy((err: unknown) => {
      return isApiError(err) && err.status === 403 && err.message === 'Interdit';
    });
  });
});
