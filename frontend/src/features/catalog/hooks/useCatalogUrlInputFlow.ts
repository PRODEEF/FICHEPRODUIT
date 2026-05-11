import { useEffect, useRef } from 'react';

import { useUrlSearch } from '@shared/hooks/useUrlSearch';

type UseCatalogUrlInputFlowOptions = {
  analysisId: string | undefined;
  defaultWebsiteUrl: string | null | undefined;
  onSubmit: (url: string) => Promise<unknown>;
};

export function useCatalogUrlInputFlow(options: UseCatalogUrlInputFlowOptions) {
  const { analysisId, defaultWebsiteUrl, onSubmit } = options;
  const search = useUrlSearch({ onSubmit });
  const defaultSiteFromProfileApplied = useRef(false);

  useEffect(() => {
    if (analysisId) return;
    if (defaultSiteFromProfileApplied.current) return;
    const fromProfile = defaultWebsiteUrl?.trim();
    if (search.input.trim() !== '') {
      defaultSiteFromProfileApplied.current = true;
      return;
    }
    if (!fromProfile) return;
    defaultSiteFromProfileApplied.current = true;
    search.setInput(fromProfile);
  }, [analysisId, defaultWebsiteUrl, search.input, search.setInput]);

  return search;
}
