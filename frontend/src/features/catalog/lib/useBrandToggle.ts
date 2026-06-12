import { useCallback, type Dispatch, type SetStateAction } from 'react';

/** Bascule une marque active (désélection si déjà sélectionnée, insensible à la casse). */
export function useBrandToggle(setActiveBrand: Dispatch<SetStateAction<string>>) {
  return useCallback(
    (brand: string) => {
      setActiveBrand((prev) =>
        prev.trim().toLowerCase() === brand.trim().toLowerCase() ? '' : brand,
      );
    },
    [setActiveBrand],
  );
}
