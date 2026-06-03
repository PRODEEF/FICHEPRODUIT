import type { Shop } from '@types-api';
import { TextLink } from '@shared/ui/TextLink';

import { needsShopSetup } from '../../store/lib/shop-setup-status';
import { BrandChips } from './BrandChips';
import { formatCmsLabel } from '../lib/productUtils';

const TOP_BRANDS_CHIP_LIMIT = 10;

function getTopBrands(brands: string[], limit: number): string[] {
  // TODO: implement this function -> move to lib once implemented
  // The goal of this function is to return the top brands of the shop
  return brands.slice(0, limit);
}

export interface ShopSummarySectionProps {
  shop: Shop;
  activeBrand: string;
  onBrandClick: (brand: string) => void;
}

/**
 * Résumé du site analysé et marques (boutique enregistrée ou dérivées des exemples catalogue).
 */
export function ShopSummarySection({ shop, activeBrand, onBrandClick }: ShopSummarySectionProps) {
  const emptyShop = needsShopSetup(shop);
  const topBrands = getTopBrands(shop.brands, TOP_BRANDS_CHIP_LIMIT);
  const urlLabel = shop.url.trim() ? shop.url : 'Url non fournie';

  if (emptyShop)
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
        <p className="text-sm text-text-secondary">
          Aucun magasin enregistré pour l’instant. Configure ton magasin pour lier des marques et
          filtrer les exemples de fiches produits.
        </p>
        <p className="text-sm">
          <TextLink to="/store">Configurer mon magasin</TextLink>
        </p>
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-1 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
        <p
          className="flex items-center gap-2 truncate text-sm font-medium text-gray-700"
          title={shop.name}
        >
          <span className="shrink-0 text-purple-600">🔗</span>
          <span className="truncate">{urlLabel}</span>
          <span className="shrink-0 text-gray-400">—</span>
          <span className="shrink-0">{formatCmsLabel(shop?.cms ?? null)}</span>
          <span className="shrink-0 text-gray-400">—</span>
          <span className="shrink-0">
            {shop.brands.length} marque{shop.brands.length > 1 ? 's' : ''} repérée
            {shop.brands.length > 1 ? 's' : ''}
          </span>
        </p>
        {shop.sector?.trim() ? (
          <p className="text-xs text-gray-500">
            Votre univers&nbsp;: {shop.sector.trim()}.
          </p>
        ) : null}
      </div>

      <section>
        <h2 className="mb-2 mt-5 text-lg font-bold text-text-primary">Vos marques principales</h2>
        <BrandChips brands={topBrands} activeBrand={activeBrand} onToggle={onBrandClick} />
      </section>
    </>
  );
}
