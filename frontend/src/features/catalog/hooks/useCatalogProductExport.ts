import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const EXPORT_NOT_IMPLEMENTED_MESSAGE = "L'export n'est pas encore implémenté";

export function useCatalogProductExport() {
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);

  const openExportConfirmation = useCallback(() => {
    setExportConfirmOpen(true);
  }, []);

  const closeExportConfirmation = useCallback(() => {
    setExportConfirmOpen(false);
  }, []);

  const confirmExport = useCallback(() => {
    setExportConfirmOpen(false);
    toast.info(EXPORT_NOT_IMPLEMENTED_MESSAGE);
  }, []);

  return {
    exportConfirmOpen,
    openExportConfirmation,
    closeExportConfirmation,
    confirmExport,
  };
}
