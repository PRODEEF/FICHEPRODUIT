import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';

import { isValidAnalysisId } from '@lib/analysis/analysisStorage';

import { AnalysisResult } from '../components/AnalysisResult';
import { GuestAnalysisSignupCta } from '../components/GuestAnalysisSignupCta';
import { useAnalysisDetail } from '../hooks/useAnalysisDetail';

/**
 * Vue publique d'une analyse pour les visiteurs non connectés.
 *
 * Affiche le détail d'une analyse identifiée par `analysisId` ainsi qu'un appel à
 * l'inscription. Toute analyse introuvable ou identifiant invalide redirige vers la page
 * d'accueil afin d'éviter une page vide aux invités.
 */
export function PublicCatalog() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();

  const hasValidAnalysisId = isValidAnalysisId(analysisId);

  const {
    analysis,
    shop,
    products,
    productPayload,
    loading: detailLoading,
    error: detailError,
    analysisNotFound,
  } = useAnalysisDetail(analysisId, undefined, false);

  useEffect(() => {
    if (!analysisId || !hasValidAnalysisId || !analysisNotFound) return;
    void navigate('/', { replace: true });
  }, [analysisId, hasValidAnalysisId, analysisNotFound, navigate]);

  if (!analysisId || !hasValidAnalysisId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative z-[1] w-full px-12 pb-12 pt-9">
      <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
        <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
      </header>

      {!detailLoading && !detailError && analysis?.status === 'done' ? (
        <GuestAnalysisSignupCta websiteUrl={analysis.url} />
      ) : null}

      <AnalysisResult
        isConnected={false}
        loading={detailLoading}
        error={detailError}
        analysis={analysis}
        shop={shop}
        products={products}
        productPayload={productPayload}
      />
    </div>
  );
}
