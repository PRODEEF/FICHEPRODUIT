import type { Analysis, Shop } from '@types-api';

import { formatCmsLabel } from '../lib/productUtils';

type AnalysisSiteSummaryProps = {
  analysis: Analysis;
  shop: Shop | null;
  /** Nombre de marques repérées sur le site (analyse) ou, à défaut, dérivé des exemples. */
  brandCount: number;
};

export function AnalysisSiteSummary({ analysis, shop, brandCount }: AnalysisSiteSummaryProps) {
  const vertical = shop?.sector?.trim() ?? null;

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
      <p className="flex items-center gap-2 truncate text-sm font-medium text-gray-700" title={analysis.url}>
        <span className="shrink-0 text-purple-600">🔗</span>
        <span className="truncate">{analysis.url}</span>
        <span className="shrink-0 text-gray-400">—</span>
        <span className="shrink-0">{formatCmsLabel(shop?.cms ?? null)}</span>
        <span className="shrink-0 text-gray-400">—</span>
        <span className="shrink-0">
          {brandCount} marque{brandCount !== 1 ? 's' : ''} repérée{brandCount !== 1 ? 's' : ''}
        </span>
      </p>
      {vertical ? (
        <p className="text-xs text-gray-500">Périmètre détecté&nbsp;: vous vendez {vertical}.</p>
      ) : null}
    </div>
  );
}
