import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { downloadExportCsv, ExportInsufficientCreditsError } from '@api/export';
import type { ExportBody } from '@api/types/api.types';

export function useCatalogProductExport() {
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false);

  const dismissInsufficientCredits = useCallback(() => {
    setInsufficientCreditsOpen(false);
  }, []);

  const exportProducts = useCallback(async (body: ExportBody, filename?: string) => {
    try {
      await downloadExportCsv(body, filename);
    } catch (err) {
      if (err instanceof ExportInsufficientCreditsError) {
        setInsufficientCreditsOpen(true);
        return;
      }
      const message = err instanceof Error ? err.message : 'Export impossible pour le moment.';
      toast.error('Export échoué', { description: message });
    }
  }, []);

  return {
    exportProducts,
    insufficientCreditsOpen,
    dismissInsufficientCredits,
  };
}
