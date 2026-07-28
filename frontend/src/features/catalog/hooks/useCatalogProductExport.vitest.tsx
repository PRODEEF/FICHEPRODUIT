// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const downloadMock = vi.fn<(...args: unknown[]) => Promise<void>>();
const toastSuccess = vi.fn<(...args: unknown[]) => void>();
const toastError = vi.fn<(...args: unknown[]) => void>();

vi.mock('@api/export', () => ({
  downloadPrestashopExportCsv: (...args: unknown[]) => downloadMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => {
      toastSuccess(...args);
    },
    error: (...args: unknown[]) => {
      toastError(...args);
    },
  },
}));

import { useCatalogProductExport } from './useCatalogProductExport';

const shopId = '550e8400-e29b-41d4-a716-446655440003';
const productIds = ['550e8400-e29b-41d4-a716-446655440001'];

describe('useCatalogProductExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadMock.mockResolvedValue(undefined);
  });

  it('enchaîne products puis combinations et toast succès', async () => {
    const { result } = renderHook(() =>
      useCatalogProductExport({ shopId, selectedProductIds: productIds }),
    );

    await act(async () => {
      await result.current.confirmExport();
    });

    expect(downloadMock).toHaveBeenNthCalledWith(1, {
      type: 'products',
      shopId,
      productIds,
    });
    expect(downloadMock).toHaveBeenNthCalledWith(2, {
      type: 'combinations',
      shopId,
      productIds,
    });
    expect(toastSuccess).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('refuse sans shopId', async () => {
    const { result } = renderHook(() =>
      useCatalogProductExport({ shopId: null, selectedProductIds: productIds }),
    );

    await act(async () => {
      await result.current.confirmExport();
    });

    expect(downloadMock).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
  });

  it('n’appelle pas combinations si products échoue', async () => {
    downloadMock.mockRejectedValueOnce(new Error('Échec products'));

    const { result } = renderHook(() =>
      useCatalogProductExport({ shopId, selectedProductIds: productIds }),
    );

    await act(async () => {
      await result.current.confirmExport();
    });

    expect(downloadMock).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('Échec products');
  });

  it('signale l’échec combinations après un products réussi', async () => {
    downloadMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Échec combinations'));

    const { result } = renderHook(() =>
      useCatalogProductExport({ shopId, selectedProductIds: productIds }),
    );

    await act(async () => {
      await result.current.confirmExport();
    });

    expect(downloadMock).toHaveBeenCalledTimes(2);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('Échec combinations'));
  });
});
