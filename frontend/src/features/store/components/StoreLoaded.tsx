import { useCallback } from 'react';

import type { Shop } from '@types-api';
import { BrandsCsvImportButton } from './BrandsCsvImportButton';
import { CategoryTreeEditor } from './CategoryTreeEditor';
import { ShopInfoSection } from './ShopInfoSection';
import { SuggestBrands } from './SuggestBrands';
import { TagListEditor } from './TagListEditor';
import { findTagCaseInsensitive, shopTagDuplicateMessage } from '../lib/shopSchemas';
import { useShopPatch } from '../hooks/useShopPatch';

interface StoreLoadedProps {
  shop: Shop;
  updateShop: (shop: Shop) => void;
  showAnalyzeAction: boolean;
  onAnalyze: () => void;
  analyzeDisabled: boolean;
}

/**
 * Contenu principal de la page magasin une fois le shop chargé
 * (infos, marques, arbre de catégories).
 */
export function StoreLoaded({
  shop,
  updateShop,
  showAnalyzeAction,
  onAnalyze,
  analyzeDisabled,
}: StoreLoadedProps) {
  const { patchShop, patching } = useShopPatch({ updateShop });

  const validateBrandBeforeAdd = useCallback(
    (tag: string) => {
      const existing = findTagCaseInsensitive(shop.brands, tag);
      return existing ? shopTagDuplicateMessage(existing) : null;
    },
    [shop.brands],
  );

  const handleAddBrands = useCallback(
    async (brands: string[]) => {
      const deduplicated = brands.reduce<string[]>((acc, brand) => {
        const alreadyIn = findTagCaseInsensitive([...shop.brands, ...acc], brand);
        if (!alreadyIn) acc.push(brand);
        return acc;
      }, []);
      if (deduplicated.length === 0) return;
      await patchShop({ brands: [...shop.brands, ...deduplicated] });
    },
    [shop.brands, patchShop],
  );

  return (
    <>
      <ShopInfoSection
        shop={shop}
        onSavePartial={patchShop}
        saving={patching}
        showAnalyzeAction={showAnalyzeAction}
        onAnalyze={onAnalyze}
        analyzeDisabled={analyzeDisabled}
      />

      <TagListEditor
        label="Marques"
        tags={shop.brands}
        disabled={patching}
        trailingActions={
          <>
            <SuggestBrands
              sector={shop.sector}
              existingBrands={shop.brands}
              disabled={patching}
              onAddBrands={handleAddBrands}
            />
            <BrandsCsvImportButton
              existingBrands={shop.brands}
              disabled={patching}
              onImportBrands={async (brands) => {
                await patchShop({ brands });
              }}
            />
          </>
        }
        onValidateBeforeAdd={validateBrandBeforeAdd}
        onAdd={async (tag) => {
          await patchShop({ brands: [...shop.brands, tag] });
        }}
        onRemove={async (tag) => {
          await patchShop({ brands: shop.brands.filter((t) => t !== tag) });
        }}
      />
      <CategoryTreeEditor
        tree={shop.categoryTree}
        disabled={patching}
        onChange={async (categoryTree) => {
          await patchShop({ categoryTree });
        }}
      />
    </>
  );
}
