import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { fetchBrandsBySector } from '@api/catalog';
import { apiErrorMessage } from '@lib/apiErrorMessage';

interface UseSuggestSectorBrandsOptions {
  sector: string;
  existingBrands: string[];
}

/**
 * Charge les marques suggérées pour un secteur depuis le catalogue,
 * en excluant celles déjà présentes dans la liste (insensible à la casse).
 */
export function useSuggestSectorBrands({ sector, existingBrands }: UseSuggestSectorBrandsOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sector.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const brands = await fetchBrandsBySector(sector);
      const existingLower = new Set(existingBrands.map((b) => b.toLocaleLowerCase()));
      setSuggestions(brands.filter((b) => !existingLower.has(b.toLocaleLowerCase())));
    } catch (e) {
      const message = apiErrorMessage(e, 'Impossible de charger les suggestions de marques.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [sector, existingBrands]);

  return { suggestions, loading, error, load };
}
