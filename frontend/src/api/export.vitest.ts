// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthHeadersNoBody } = vi.hoisted(() => ({
  mockAuthHeadersNoBody: vi.fn(),
}));

vi.mock('./apiBase', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

vi.mock('./apiAuth', () => ({
  authHeadersNoBody: mockAuthHeadersNoBody,
  extractErrorMessage: (parsed: unknown, fallback: string) => {
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const message = parsed.message;
      if (typeof message === 'string') return message;
    }
    return fallback;
  },
}));

import { downloadPrestashopExportCsv } from './export';

describe('downloadPrestashopExportCsv', () => {
  const shopId = '550e8400-e29b-41d4-a716-446655440003';
  const productId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthHeadersNoBody.mockResolvedValue({
      Authorization: 'Bearer jwt',
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('appelle GET /api/export/prestashop avec la query attendue', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('csv', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="products.csv"',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await downloadPrestashopExportCsv({
      type: 'products',
      shopId,
      productIds: [productId],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `http://api.test/api/export/prestashop?type=products&shopId=${shopId}&productIds=${productId}`,
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer jwt' },
      }),
    );
  });

  it('lève une erreur claire sur 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));

    await expect(
      downloadPrestashopExportCsv({
        type: 'combinations',
        shopId,
        productIds: [productId],
      }),
    ).rejects.toThrow('Session expirée ou non autorisée');
  });

  it('propage le message Nest sur erreur métier', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: 'Référence manquante' }), { status: 400 }),
        ),
    );

    await expect(
      downloadPrestashopExportCsv({
        type: 'products',
        shopId,
        productIds: [productId],
      }),
    ).rejects.toThrow('Référence manquante');
  });
});
