import type { ReactNode } from 'react';

import { ErrorState, LoadingState } from './CatalogSectionStates';
import { ShopSummarySection } from './ShopSummarySection';
import type { Shop } from '../../store/types';

export interface CatalogPageLayoutProps {
  topBanner?: ReactNode;
  afterHeader?: ReactNode;
  shopLoading: boolean;
  shopError: string | null;
  shop: Shop | null;
  activeBrand: string;
  onBrandToggle: (brand: string) => void;
  productsLoading: boolean;
  productsError: string | null;
  productsSection: ReactNode | null;
}

export function CatalogPageLayout({
  topBanner,
  afterHeader,
  shopLoading,
  shopError,
  shop,
  activeBrand,
  onBrandToggle,
  productsLoading,
  productsError,
  productsSection,
}: CatalogPageLayoutProps) {
  return (
    <>
      {topBanner}
      <div className="relative z-[1] w-full px-12 pb-12 pt-9">
        <header className="mb-5 flex flex-wrap items-center gap-4 text-left">
          <h1 className="m-0 text-[1.75rem] font-extrabold text-text-primary">Mon catalogue</h1>
        </header>

        {afterHeader}

        <div className="mb-6 flex flex-col gap-4">
          {shopLoading ? (
            <LoadingState label="Chargement de votre boutique…" />
          ) : shopError !== null || shop === null ? (
            <ErrorState
              message={shopError ?? 'Une erreur est survenue lors du chargement de votre boutique'}
            />
          ) : (
            <ShopSummarySection
              shop={shop}
              activeBrand={activeBrand}
              onBrandClick={onBrandToggle}
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {shop === null ? null : productsLoading ? (
            <LoadingState label="Chargement des fiches…" />
          ) : productsError ? (
            <ErrorState message={productsError} />
          ) : (
            productsSection
          )}
        </div>
      </div>
    </>
  );
}
