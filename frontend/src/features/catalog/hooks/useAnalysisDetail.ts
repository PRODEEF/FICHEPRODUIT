import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { getAnalysis } from '@api/analysis';
import { getMyShop } from '@api/shop';
import type { Analysis, CatalogProduct, Shop } from '@types-api';
import {
  getAnalysisDetailCache,
  isValidGuestSessionId,
  setAnalysisDetailCache,
} from '@lib/analysis/analysisStorage';

import { useCatalogProductsByIds } from './useCatalogProductsByIds';
import type { CatalogProductPayloadMetadata } from '../types';

const CACHE_GUEST_KEY = 'guest';

type UseAnalysisDetailResult = {
  analysis: Analysis | null;
  shop: Shop | null;
  productPayload: CatalogProductPayloadMetadata | null;
  products: CatalogProduct[] | null;
  loading: boolean;
  error: string | null;
  analysisNotFound: boolean;
};

export function useAnalysisDetail(
  analysisId: string | undefined,
  userId: string | undefined,
  authLoading: boolean,
): UseAnalysisDetailResult {
  const [searchParams] = useSearchParams();
  const cacheUserId = userId ?? CACHE_GUEST_KEY;

  const guestSessionFromQuery = useMemo(() => {
    if (userId) return undefined;
    const raw = searchParams.get('s');
    return isValidGuestSessionId(raw) ? raw : undefined;
  }, [userId, searchParams]);

  const [loading, setLoading] = useState(() => Boolean(analysisId));
  const [analysis, setAnalysis] = useState<Analysis | null>(() => {
    if (!analysisId) return null;
    return getAnalysisDetailCache<Analysis, CatalogProductPayloadMetadata, Shop>(cacheUserId, analysisId)
      ?.analysis ?? null;
  });
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisNotFound, setAnalysisNotFound] = useState(false);

  const shouldLoadProducts = analysis?.status === 'done';
  const guestSessionForCatalog = useMemo(() => {
    if (userId) return undefined;
    return guestSessionFromQuery ?? analysis?.sessionId ?? undefined;
  }, [userId, guestSessionFromQuery, analysis?.sessionId]);

  const {
    products,
    metadata: productPayload,
    loading: productsLoading,
    error: productsError,
  } = useCatalogProductsByIds(shop, shouldLoadProducts, guestSessionForCatalog);

  useEffect(() => {
    if (!analysisId || authLoading) return;
    setError(null);
    setAnalysisNotFound(false);
    const cached = getAnalysisDetailCache<Analysis, CatalogProductPayloadMetadata, Shop>(
      cacheUserId,
      analysisId,
    );
    if (cached) {
      setAnalysis(cached.analysis);
      setShop(cached.shop ?? null);
      setLoading(false);
    } else {
      setAnalysis(null);
      setShop(null);
      setLoading(true);
    }
  }, [analysisId, authLoading, cacheUserId]);

  useEffect(() => {
    if (!analysisId || authLoading) return;
    let cancelled = false;

    void (async () => {
      try {
        const a = await getAnalysis(analysisId, guestSessionFromQuery);
        if (cancelled) return;
        const guestHdr = !userId ? (guestSessionFromQuery ?? a.sessionId) ?? undefined : undefined;

        let nextShop: Shop | null = null;
        if (a.status === 'done' && a.shopId) {
          if (userId) {
            const myShop = await getMyShop();
            if (cancelled) return;
            if (myShop && myShop.id === a.shopId) {
              nextShop = myShop;
            }
          } else {
            nextShop = await getMyShop(a.shopId, guestHdr);
            if (cancelled) return;
            if (nextShop && nextShop.id !== a.shopId) {
              nextShop = null;
            }
          }
        }
        setAnalysis(a);
        setShop(nextShop);
        setAnalysisDetailCache(cacheUserId, analysisId, { analysis: a, shop: nextShop });
        setError(null);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Erreur de chargement.';
          const lowered = message.toLowerCase();
          setAnalysisNotFound(lowered.includes('introuvable') || lowered.includes('not found'));
          setError(message);
          const cached = getAnalysisDetailCache<Analysis, CatalogProductPayloadMetadata, Shop>(
            cacheUserId,
            analysisId,
          );
          if (!cached) {
            setAnalysis(null);
            setShop(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, analysisId, authLoading, cacheUserId, guestSessionFromQuery]);

  const combinedLoading = loading || productsLoading;
  const combinedError = useMemo(() => {
    if (error) return error;
    if (productsError) return productsError;
    return null;
  }, [error, productsError]);

  return {
    analysis,
    shop,
    productPayload,
    products,
    loading: combinedLoading,
    error: combinedError,
    analysisNotFound,
  };
}
