export interface ProductFilter {
  search: string;
  sector: string;
  category: string;
  subCategory: string;
  brand: string;
  year: string;
}

export interface CatalogProductPayloadMetadata {
  brands: string[];
  categories: string[];
  subCategories: string[];
  years: string[];
}
