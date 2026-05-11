import type { Analysis } from '@types-api';

export type CatalogWorkflowStatus =
  | 'idle'
  | 'waiting_analysis'
  | 'loading_products'
  | 'ready'
  | 'failed';

interface ResolveCatalogWorkflowStatusInput {
  analysis: Analysis | null;
  loadingProducts: boolean;
  hasProducts: boolean;
  error: string | null;
}

export function resolveCatalogWorkflowStatus(
  input: ResolveCatalogWorkflowStatusInput,
): CatalogWorkflowStatus {
  const { analysis, loadingProducts, error } = input;
  if (error) return 'failed';
  if (!analysis) return 'idle';
  if (analysis.status === 'failed') return 'failed';
  if (analysis.status !== 'done') return 'waiting_analysis';
  if (loadingProducts) return 'loading_products';
  return 'ready';
}
