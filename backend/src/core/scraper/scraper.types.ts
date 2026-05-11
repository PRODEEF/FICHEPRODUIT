export type CmsType = "prestashop" | "shopify" | "woocommerce" | "unknown";

// Résultat du fetch
export type ScrapePageResult =
  | {
      ok: true;
      html: string;
      cms: CmsType;
      title: string;
      textSample: string;
    }
  | {
      ok: false;
      error: string;
    };

// Résultat de la classification
export type ClassifyResult = {
  sector: string | null; // null si UNKNOWN_SECTOR
  categories: string[]; // catalogMatchCategories
  brands: string[]; // brandsList
  verticalSummary: string | null;
};
