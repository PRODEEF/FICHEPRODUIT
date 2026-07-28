import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { downloadPrestashopExportCsv } from '@api/export';

interface UseCatalogProductExportOptions {
  shopId: string | null | undefined;
  selectedProductIds: string[];
}

export function useCatalogProductExport({
  shopId,
  selectedProductIds,
}: UseCatalogProductExportOptions) {
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const openExportConfirmation = useCallback(() => {
    setExportConfirmOpen(true);
  }, []);

  const closeExportConfirmation = useCallback(() => {
    if (isExporting) return;
    setExportConfirmOpen(false);
  }, [isExporting]);

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

    setExportConfirmOpen(false);
    setIsExporting(true);

    try {
      await downloadPrestashopExportCsv({
        type: 'products',
        shopId,
        productIds: selectedProductIds,
      });

      try {
        await downloadPrestashopExportCsv({
          type: 'combinations',
          shopId,
          productIds: selectedProductIds,
        });
        toast.success('Export PrestaShop téléchargé (produits et déclinaisons).');
      } catch (combinationsError) {
        const message =
          combinationsError instanceof Error
            ? combinationsError.message
            : 'Impossible de télécharger les déclinaisons.';
        toast.error(`Produits exportés, mais échec des déclinaisons : ${message}`);
      }
    } catch (productsError) {
      const message =
        productsError instanceof Error ? productsError.message : 'Impossible de générer l’export.';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, selectedProductIds, shopId]);

  return {
    exportConfirmOpen,
    isExporting,
    openExportConfirmation,
    closeExportConfirmation,
    confirmExport,
  };
}
