export interface ProductFilter {
  search: string;
  brand: string;
  category: string;
  subCategory: string;
  year: string;
  priceMin: string;
  priceMax: string;
}

export interface CatalogProductPayloadMetadata {
  brands: string[];
  categories: string[];
  subCategories: string[];
  years: string[];
}
