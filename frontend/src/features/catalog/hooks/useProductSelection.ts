import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Product } from '@lib/analysis/analysisApi';

import type { ProductFilter } from '../types';

type UseProductSelectionResult = {
  selectedIds: Set<string>;
  toggleOne: (id: string, checked: boolean) => void;
  toggleSelectAll: () => void;
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  selectedInViewCount: number;
  importSelected: () => void;
  deleteSelected: () => void;
};

export function useProductSelection(
  filteredProducts: Product[],
  filters: ProductFilter,
  onRemoveIds: (ids: string[]) => void,
): UseProductSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    queueMicrotask(() => setSelectedIds(new Set()));
  }, [filters.search, filters.brand, filters.category, filters.subCategory, filters.year]);

  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));
  const someFilteredSelected = filteredProducts.some((p) => selectedIds.has(p.id));

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const p of filteredProducts) next.delete(p.id);
      } else {
        for (const p of filteredProducts) next.add(p.id);
      }
      return next;
    });
  }, [allFilteredSelected, filteredProducts]);

  const selectedInViewCount = useMemo(
    () => filteredProducts.filter((p) => selectedIds.has(p.id)).length,
    [filteredProducts, selectedIds],
  );

  const importSelected = useCallback(() => {
    toast.success(`${selectedInViewCount} fiche(s) importée(s) avec succès !`);
  }, [selectedInViewCount]);

  const deleteSelected = useCallback(() => {
    const toRemove = filteredProducts.filter((p) => selectedIds.has(p.id));
    if (toRemove.length === 0) return;
    toast(`Supprimer ${toRemove.length} fiche(s) de la vue ?`, {
      action: {
        label: 'Confirmer',
        onClick: () => {
          onRemoveIds(toRemove.map((p) => p.id));
          setSelectedIds(new Set());
        },
      },
    });
  }, [filteredProducts, selectedIds, onRemoveIds]);

  return {
    selectedIds,
    toggleOne,
    toggleSelectAll,
    allFilteredSelected,
    someFilteredSelected,
    selectedInViewCount,
    importSelected,
    deleteSelected,
  };
}
