import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { fetchSuggestUrls } from '../lib/suggestUrls';
import { parseAsSiteUrl } from '@lib/utils/siteUrl';

type UseLandingSearchParams = {
  runAnalysis: (url: string) => Promise<unknown>;
};

/** État local de la recherche depuis la landing (saisie, suggestions Tavily/heuristiques, erreurs de validation). */
export function useLandingSearch({ runAnalysis }: UseLandingSearchParams) {
  const [siteInput, setSiteInputState] = useState('');
  const [suggestedUrls, setSuggestedUrls] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchEmptyError, setSearchEmptyError] = useState(false);

  const setSiteInput = useCallback((value: string) => {
    setSiteInputState(value);
    setSuggestedUrls([]);
    setSearchEmptyError(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const raw = siteInput.trim();
    if (!raw) {
      setSearchEmptyError(true);
      return;
    }

    setSearchEmptyError(false);
    const directUrl = parseAsSiteUrl(raw);
    if (directUrl) {
      setSuggestedUrls([]);
      await runAnalysis(directUrl);
      return;
    }

    setSuggestionsLoading(true);
    setSuggestedUrls([]);

    try {
      const urls = await fetchSuggestUrls(raw);
      if (urls.length) {
        setSuggestedUrls(urls);
      } else {
        toast.warning('Aucune adresse proposée. Essaie une URL complète (ex. https://…) ou un nom plus précis.');
      }
    } catch {
      toast.error('Impossible de récupérer des suggestions pour le moment.');
    } finally {
      setSuggestionsLoading(false);
    }
  }, [siteInput, runAnalysis]);

  const handlePickSuggestion = useCallback(
    async (url: string) => {
      setSuggestedUrls([]);
      setSiteInputState(url);
      await runAnalysis(url);
    },
    [runAnalysis],
  );

  return {
    siteInput,
    setSiteInput,
    suggestedUrls,
    suggestionsLoading,
    searchEmptyError,
    handleSubmit,
    handlePickSuggestion,
  };
}
