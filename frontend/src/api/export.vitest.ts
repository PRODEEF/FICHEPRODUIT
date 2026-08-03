// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuthHeaders } = vi.hoisted(() => ({
  mockAuthHeaders: vi.fn(),
}));

vi.mock('./apiBase', () => ({
  getApiBaseUrl: () => 'http://api.test',
}));

vi.mock('./apiAuth', () => ({
  authHeaders: mockAuthHeaders,
  extractErrorMessage: (parsed: unknown, fallback: string) => {
    if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
      const message = parsed.message;
      if (typeof message === 'string') return message;
    }
    return fallback;
  },
}));

const { mockRequestNestJson } = vi.hoisted(() => ({
  mockRequestNestJson: vi.fn(),
}));

vi.mock('./nestHttpClient', () => ({
  requestNestJson: mockRequestNestJson,
  getSupabaseSessionAuthHeaders: vi.fn(),
}));

import {
  downloadPrestashopExportCsv,
  fetchCategoryExportPreview,
  filenameFromContentDisposition,
} from './export';

describe('filenameFromContentDisposition', () => {
  it('extrait le nom de fichier du header', () => {
    expect(
      filenameFromContentDisposition('attachment; filename="products.csv"', 'fallback.csv'),
    ).toBe('products.csv');
  });

  it('retourne le fallback si header absent ou invalide', () => {
    expect(filenameFromContentDisposition(null, 'fallback.csv')).toBe('fallback.csv');
    expect(filenameFromContentDisposition('inline', 'fallback.csv')).toBe('fallback.csv');
  });
});

describe('fetchCategoryExportPreview', () => {
  const shopId = '550e8400-e29b-41d4-a716-446655440003';
  const productId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestNestJson.mockResolvedValue({ pairs: [], treeOptions: [] });
  });

  it('appelle POST /api/export/prestashop/category-preview avec le corps JSON', async () => {
    await fetchCategoryExportPreview({ shopId, productIds: [productId] });

    expect(mockRequestNestJson).toHaveBeenCalledWith({
      method: 'POST',
      path: '/export/prestashop/category-preview',
      body: { shopId, productIds: [productId] },
      authHeaders: expect.any(Function) as () => Promise<Record<string, string>>,
    });
  });
});

describe('downloadPrestashopExportCsv', () => {
  const shopId = '550e8400-e29b-41d4-a716-446655440003';
  const productId = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthHeaders.mockResolvedValue({
      Authorization: 'Bearer jwt',
      'Content-Type': 'application/json',
    });
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  it('appelle POST /api/export/prestashop avec le corps JSON attendu', async () => {
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
      'http://api.test/api/export/prestashop',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer jwt',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'products',
          shopId,
          productIds: [productId],
        }),
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

  it('remplace Failed to fetch par un message explicite', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(
      downloadPrestashopExportCsv({
        type: 'products',
        shopId,
        productIds: [productId],
      }),
    ).rejects.toThrow('Impossible de contacter le serveur');
  });
});
