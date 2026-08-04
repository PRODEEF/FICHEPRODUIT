import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';

import { AnalysisProgress } from '@shared/components/AnalysisProgress';

import { ReanalysisConfirmModal } from '../components/ReanalysisConfirmModal';
import { StoreLoaded } from '../components/StoreLoaded';
import { useShop } from '../hooks/useShop';
import { useStoreSiteAnalysis } from '../hooks/useStoreSiteAnalysis';

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

export function MyStore() {
  const navigate = useNavigate();
  const { shop, loading, error, updateShop, refetch } = useShop();

  const handleAnalysisSuccess = useCallback(() => {
    void (async () => {
      await refetch();
      void navigate('/catalog', { replace: true });
    })();
  }, [navigate, refetch]);

  const {
    startAnalysis,
    analysisOpen,
    siteAnalysis,
    dismissError,
    reanalysisModalOpen,
    confirmReanalysis,
    cancelReanalysis,
  } = useStoreSiteAnalysis({
    shop,
    onSuccess: handleAnalysisSuccess,
  });

  const handleAnalyzeClick = useCallback(() => {
    if (!shop?.url.trim()) return;
    void startAnalysis(shop.url);
  }, [shop, startAnalysis]);

  useEffect(() => {
    if (!loading && shop === null && !error) {
      void navigate('/', { replace: true });
    }
  }, [loading, shop, error, navigate]);

  if (loading && !shop) {
    return <LoadingState />;
  }

  if (!shop) {
    if (error) {
      return (
        <div className="relative z-[1] w-full px-12 pb-12 pt-9">
          <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
          <p className="mt-4 text-sm text-red-600">{error}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      {analysisOpen && siteAnalysis ? (
        <AnalysisProgress analysis={siteAnalysis} onDismiss={dismissError} />
      ) : null}

      <header className="mb-6 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon magasin</h1>
      </header>

      <ReanalysisConfirmModal
        open={reanalysisModalOpen}
        onClose={cancelReanalysis}
        onConfirm={confirmReanalysis}
      />

      <StoreLoaded
        shop={shop}
        updateShop={updateShop}
        showAnalyzeAction={shop.url.trim().length > 0}
        onAnalyze={handleAnalyzeClick}
        analyzeDisabled={analysisOpen}
      />
    </div>
  );
}
