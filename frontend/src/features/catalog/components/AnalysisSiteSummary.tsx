import type { SiteAnalysis } from '@lib/analysis/analysisApi';

import { formatCmsLabel } from '../lib/productUtils';

type AnalysisSiteSummaryProps = {
  analysis: SiteAnalysis;
  productCount: number;
  brandCount: number;
};

export function AnalysisSiteSummary({ analysis, productCount, brandCount }: AnalysisSiteSummaryProps) {
  const vertical = analysis.verticalSummary?.trim();

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-white px-5 py-3 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-700 truncate" title={analysis.url}>
        <span className="text-purple-600 shrink-0">🔗</span>
        <span className="truncate">{analysis.url}</span>
        <span className="shrink-0 text-gray-400">—</span>
        <span className="shrink-0">{formatCmsLabel(analysis.cmsType)}</span>
        <span className="shrink-0 text-gray-400">—</span>
        <span className="shrink-0">{brandCount} marque{brandCount !== 1 ? 's' : ''}</span>
        <span className="shrink-0 text-gray-400">—</span>
        <span className="shrink-0">{productCount} produit{productCount !== 1 ? 's' : ''}</span>
      </p>
      {vertical ? (
        <p className="text-xs text-gray-500">Vous vendez {vertical}.</p>
      ) : null}
    </div>
  );
}
