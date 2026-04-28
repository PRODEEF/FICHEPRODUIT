/** Summary passed to the UI after a completed site analysis. */
export type SiteAnalysisSummary = {
  id: string
  url: string
  cms?: string
  verticalSummary?: string
  catalogMatchCategories?: string[]
  mainBrands?: string[]
}
