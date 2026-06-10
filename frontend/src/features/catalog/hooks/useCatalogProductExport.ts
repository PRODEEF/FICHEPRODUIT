import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { downloadExportCsv, ExportInsufficientCreditsError } from '@api/export';
import type { ExportBody } from '@api/types/api.types';

export interface InsufficientCreditsDetails {
  requiredCredits: number;
  availableCredits: number;
}

export function useCatalogProductExport() {
  const [insufficientCreditsOpen, setInsufficientCreditsOpen] = useState(false);
  const [insufficientCreditsDetails, setInsufficientCreditsDetails] =
    useState<InsufficientCreditsDetails>({ requiredCredits: 0, availableCredits: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const dismissInsufficientCredits = useCallback(() => {
    setInsufficientCreditsOpen(false);
    setInsufficientCreditsDetails({ requiredCredits: 0, availableCredits: 0 });
  }, []);

  const exportProducts = useCallback(async (body: ExportBody, filename?: string) => {
    setIsExporting(true);
    try {
      await downloadExportCsv(body, filename);
    } catch (err) {
      if (err instanceof ExportInsufficientCreditsError) {
        setInsufficientCreditsDetails({
          requiredCredits: err.requiredCredits ?? 0,
          availableCredits: err.availableCredits ?? 0,
        });
        setInsufficientCreditsOpen(true);
        return;
      }
      const message = err instanceof Error ? err.message : 'Export impossible pour le moment.';
      toast.error('Export échoué', { description: message });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportProducts,
    isExporting,
    insufficientCreditsOpen,
    insufficientCreditsDetails,
    dismissInsufficientCredits,
  };
}
