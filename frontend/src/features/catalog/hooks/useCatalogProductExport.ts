import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { downloadPrestashopExportCsv, fetchCategoryExportPreview } from '@api/export';
import type {
  CategoryExportOverride,
  CategoryExportPreviewPair,
  CategoryExportTreeOption,
} from '@types-api';

import { formatExportClientError, PRESTASHOP_EXPORT_MAX_PRODUCTS } from '@api/exportLimits';

interface UseCatalogProductExportOptions {
  shopId: string | null | undefined;
  selectedProductIds: string[];
}

const MANUFACTURER_VALUE = '__manufacturer__';

export function useCatalogProductExport({
  shopId,
  selectedProductIds,
}: UseCatalogProductExportOptions) {
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pairs, setPairs] = useState<CategoryExportPreviewPair[]>([]);
  const [treeOptions, setTreeOptions] = useState<CategoryExportTreeOption[]>([]);
  /** sourceKey → nodeId sélectionné, ou MANUFACTURER_VALUE */
  const [selections, setSelections] = useState<Record<string, string>>({});

  const openExportConfirmation = useCallback(() => {
    if (selectedProductIds.length === 0) {
      toast.error('Sélectionne au moins un produit à exporter.');
      return;
    }
    if (selectedProductIds.length > PRESTASHOP_EXPORT_MAX_PRODUCTS) {
      toast.error(
        `L’export PrestaShop est limité à ${PRESTASHOP_EXPORT_MAX_PRODUCTS} produits par fichier. Tu en as sélectionné ${selectedProductIds.length} — filtre ou réduis la sélection.`,
      );
      return;
    }
    setExportConfirmOpen(true);
  }, [selectedProductIds]);

  const closeExportConfirmation = useCallback(() => {
    if (isExporting) return;
    setExportConfirmOpen(false);
  }, [isExporting]);

  const setPairSelection = useCallback((sourceKey: string, value: string) => {
    setSelections((prev) => ({ ...prev, [sourceKey]: value }));
  }, []);

  useEffect(() => {
    if (!exportConfirmOpen || !shopId || selectedProductIds.length === 0) {
      return;
    }

    const controller = new AbortController();

    void (async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const preview = await fetchCategoryExportPreview({
          shopId,
          productIds: selectedProductIds,
        });
        if (controller.signal.aborted) return;
        setPairs(preview.pairs);
        setTreeOptions(preview.treeOptions);
        const initial: Record<string, string> = {};
        for (const pair of preview.pairs) {
          initial[pair.sourceKey] = pair.suggestedNodeId ?? MANUFACTURER_VALUE;
        }
        setSelections(initial);
      } catch (err) {
        if (controller.signal.aborted) return;
        setPreviewError(
          formatExportClientError(err, 'Impossible de prévisualiser les catégories.'),
        );
        setPairs([]);
        setTreeOptions([]);
        setSelections({});
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [exportConfirmOpen, shopId, selectedProductIds]);

  const buildOverrides = useCallback((): CategoryExportOverride[] => {
    const overrides: CategoryExportOverride[] = [];
    for (const pair of pairs) {
      const selected = selections[pair.sourceKey];
      if (selected === undefined) continue;

      const suggested = pair.suggestedNodeId ?? MANUFACTURER_VALUE;
      if (selected === suggested) continue;

      overrides.push({
        sourceKey: pair.sourceKey,
        targetNodeId: selected === MANUFACTURER_VALUE ? '' : selected,
      });
    }
    return overrides;
  }, [pairs, selections]);

  const confirmExport = useCallback(async () => {
    if (isExporting) return;

    if (!shopId) {
      toast.error('Boutique introuvable. Impossible d’exporter.');
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error('Sélectionne au moins un produit à exporter.');
      return;
    }

    if (previewError !== null) {
      toast.error('Corrige l’aperçu des catégories avant d’exporter.');
      return;
    }

    setExportConfirmOpen(false);
    setIsExporting(true);

    const categoryOverrides = buildOverrides();

    try {
      await downloadPrestashopExportCsv({
        type: 'products',
        shopId,
        productIds: selectedProductIds,
        categoryOverrides,
      });

      try {
        await downloadPrestashopExportCsv({
          type: 'combinations',
          shopId,
          productIds: selectedProductIds,
        });
        toast.success('Export PrestaShop téléchargé (produits et déclinaisons).');
      } catch (combinationsError) {
        const message = formatExportClientError(
          combinationsError,
          'Impossible de télécharger les déclinaisons.',
        );
        toast.error(`Produits exportés, mais échec des déclinaisons : ${message}`);
      }
    } catch (productsError) {
      const message = formatExportClientError(productsError, 'Impossible de générer l’export.');
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }, [buildOverrides, isExporting, previewError, selectedProductIds, shopId]);

  return {
    exportConfirmOpen,
    isExporting,
    previewLoading,
    previewError,
    pairs,
    treeOptions,
    selections,
    manufacturerValue: MANUFACTURER_VALUE,
    openExportConfirmation,
    closeExportConfirmation,
    setPairSelection,
    confirmExport,
  };
}
