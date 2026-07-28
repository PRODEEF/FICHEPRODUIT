import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import type { Shop } from '../types';
import { BrandsCsvImportButton } from '../components/BrandsCsvImportButton';
import { CategoryTreeEditor } from '../components/CategoryTreeEditor';
import { ShopInfoSection } from '../components/ShopInfoSection';
import { StoreUrlAnalysisBanner } from '../components/StoreUrlAnalysisBanner';
import { TagListEditor } from '../components/TagListEditor';
import { findTagCaseInsensitive, shopTagDuplicateMessage } from '../lib/shopSchemas';
import { computeStoreAnalysisUi } from '../lib/storeAnalysisUi';
import { useShop } from '../hooks/useShop';
import { useShopPatch } from '../hooks/useShopPatch';

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-12 pt-9">
      <span
        className="h-10 w-10 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
        aria-hidden
      />
      <p className="text-sm text-gray-600">Chargement du magasin…</p>
    </div>
  );
}

interface StoreLoadedProps {
  shop: Shop;
  updateShop: (shop: Shop) => void;
  onUrlSaved: (url: string) => void;
  hideUrlRow: boolean;
  showAnalyzeAction: boolean;
  onAnalyze: () => void;
  analyzeDisabled: boolean;
}

function StoreLoaded({
  shop,
  updateShop,
  onUrlSaved,
  hideUrlRow,
  showAnalyzeAction,
  onAnalyze,
  analyzeDisabled,
}: StoreLoadedProps) {
  const { patchShop, patching } = useShopPatch({ updateShop, onUrlSaved });

  const validateBrandBeforeAdd = useCallback(
    (tag: string) => {
      const existing = findTagCaseInsensitive(shop.brands, tag);
      return existing ? shopTagDuplicateMessage(existing) : null;
    },
    [shop.brands],
  );

  return (
    <>
      <ShopInfoSection
        shop={shop}
        onSavePartial={patchShop}
        saving={patching}
        hideUrlRow={hideUrlRow}
        showAnalyzeAction={showAnalyzeAction}
        onAnalyze={onAnalyze}
        analyzeDisabled={analyzeDisabled}
      />

      <TagListEditor
        label="Marques"
        tags={shop.brands}
        disabled={patching}
        trailingActions={
          <BrandsCsvImportButton
            existingBrands={shop.brands}
            disabled={patching}
            onImportBrands={async (brands) => {
              await patchShop({ brands });
            }}
          />
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

export function MyStore() {
  const navigate = useNavigate();
  const { shop, loading, error, updateShop, refetch } = useShop();
  const [pendingAnalysisUrl, setPendingAnalysisUrl] = useState<string | null>(null);
  const [analysisBannerOpen, setAnalysisBannerOpen] = useState(false);
  const [setupHeroDismissed, setSetupHeroDismissed] = useState(false);

  const handleUrlSaved = useCallback((url: string) => {
    if (url.trim()) {
      setPendingAnalysisUrl(url);
      setAnalysisBannerOpen(true);
    }
  }, []);

  const handleAnalysisSuccess = useCallback(() => {
    setPendingAnalysisUrl(null);
    setAnalysisBannerOpen(false);
    setSetupHeroDismissed(true);
    void (async () => {
      await refetch();
      void navigate('/catalog', { replace: true });
    })();
  }, [navigate, refetch]);

  const handleAnalysisHeroDismiss = useCallback(() => {
    setAnalysisBannerOpen(false);
    if (pendingAnalysisUrl === null) {
      setSetupHeroDismissed(true);
    }
  }, [pendingAnalysisUrl]);

  const handleReopenAnalysis = useCallback(() => {
    setAnalysisBannerOpen(true);
  }, []);

  useEffect(() => {
    if (!loading && shop === null && !error) {
      void navigate('/', { replace: true });
    }
  }, [loading, shop, error, navigate]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="relative z-[1] w-full px-12 pb-12 pt-9">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
        <p className="mt-4 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  const analysisUi = computeStoreAnalysisUi({
    analysisBannerOpen,
    setupHeroDismissed,
    pendingAnalysisUrl,
    shopUrl: shop.url,
    brands: shop.brands,
    cms: shop.cms,
    categoryTree: shop.categoryTree,
  });

  // Ajustement d’état pendant le rendu (évite setState dans un effect).
  if (analysisUi.shouldAutoOpenBanner && !analysisBannerOpen) {
    setAnalysisBannerOpen(true);
  }

  const { showAnalysisHero, showAnalyzeAction, analysisBannerUrl, analysisBannerVariant } =
    analysisUi;

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-6 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
      </header>

      {showAnalysisHero ? (
        <StoreUrlAnalysisBanner
          url={analysisBannerUrl}
          variant={analysisBannerVariant}
          onDismiss={handleAnalysisHeroDismiss}
          onAnalysisSuccess={handleAnalysisSuccess}
        />
      ) : null}

      <StoreLoaded
        shop={shop}
        updateShop={updateShop}
        onUrlSaved={handleUrlSaved}
        hideUrlRow={showAnalysisHero}
        showAnalyzeAction={showAnalyzeAction}
        onAnalyze={handleReopenAnalysis}
        analyzeDisabled={false}
      />
    </div>
  );
}
