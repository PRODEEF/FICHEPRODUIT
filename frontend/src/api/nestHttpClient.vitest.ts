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

import { NestHttpError, messageFromNestErrorBody, requestNestJson } from './nestHttpClient';

describe('messageFromNestErrorBody', () => {
  it('retourne le fallback si le corps est vide', () => {
    expect(messageFromNestErrorBody(null, 'fallback')).toBe('fallback');
  });

  it('extrait un message string', () => {
    expect(messageFromNestErrorBody({ message: 'Erreur métier' }, 'fallback')).toBe(
      'Erreur métier',
    );
  });

  it('extrait le premier message d’un tableau', () => {
    expect(messageFromNestErrorBody({ message: ['A', 'B'] }, 'fallback')).toBe('A');
  });
});

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

  it('lève NestHttpError quand la réponse n’est pas ok', async () => {
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
      return err instanceof NestHttpError && err.status === 403 && err.message === 'Interdit';
    });
  });
});
