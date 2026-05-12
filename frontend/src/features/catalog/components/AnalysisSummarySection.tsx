import type { Analysis, CatalogProduct, Shop } from '@types-api';
import { AnalysisSiteSummary } from './AnalysisSiteSummary';
import { BrandChips } from './BrandChips';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  running: 'En cours',
  done: 'Terminée',
  failed: 'Échec',
};

const TOP_BRANDS_CHIP_LIMIT = 10;

function topBrandsByProductCount(products: CatalogProduct[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const b = p.brand.trim();
    if (!b) continue;
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], 'fr');
    })
    .slice(0, limit)
    .map(([name]) => name);
}

export interface AnalysisSummarySectionProps {
  loading: boolean;
  error: string | null;
  analysis: Analysis | null;
  shop: Shop | null;
  allProducts: CatalogProduct[];
  activeBrand: string;
  onBrandToggle: (brand: string) => void;
}

export function AnalysisSummarySection({
  loading,
  error,
  analysis,
  shop,
  allProducts,
  activeBrand,
  onBrandToggle,
}: AnalysisSummarySectionProps) {
  if (loading) {
    return (
      <p className="text-sm text-text-secondary" aria-busy="true">
        Chargement…
      </p>
    );
  }

  if (error) {
    return (
      <div
        className="mb-4 rounded-xl border border-border-purple bg-purple-50 px-4 py-3 text-text-primary"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!analysis) return null;

  if (analysis.status === 'failed') {
    return (
      <div
        className="mb-4 rounded-xl border border-red-500/35 bg-red-50 px-4 py-3 text-text-primary"
        role="alert"
      >
        {analysis.errorMessage ?? 'Analyse terminée avec erreur.'}
      </div>
    );
  }

  if (analysis.status !== 'done') {
    return (
      <p className="text-sm text-text-secondary">Statut&nbsp;: {STATUS_LABELS[analysis.status]}</p>
    );
  }

  const brandsFromShop = shop?.brands.filter(Boolean) ?? [];
  const brandsForChips =
    brandsFromShop.length > 0
      ? brandsFromShop.slice(0, TOP_BRANDS_CHIP_LIMIT)
      : topBrandsByProductCount(allProducts, TOP_BRANDS_CHIP_LIMIT);

  const brandCountDisplay = shop?.brands.filter(Boolean).length ?? brandsForChips.length;

  return (
    <>
      <AnalysisSiteSummary analysis={analysis} shop={shop} brandCount={brandCountDisplay} />

      <section>
        <h2 className="mb-2 mt-5 text-lg font-bold text-text-primary">Vos marques principales</h2>
        <BrandChips brands={brandsForChips} activeBrand={activeBrand} onToggle={onBrandToggle} />
      </section>
    </>
  );
}
