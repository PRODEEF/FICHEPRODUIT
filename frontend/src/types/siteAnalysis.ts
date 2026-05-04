/** Résumé transmis à l’interface après une analyse de site terminée avec succès. */
export type SiteAnalysisSummary = {
  id: string;
  url: string;
  cms?: string;
  verticalSummary?: string;
  catalogMatchCategories?: string[];
  mainBrands?: string[];
};
