/**
 * Produit issu d’un catalogue fabricant (données scrappées ou importées).
 * Aligné sur le modèle métier FicheProduit : attributs libres pour les spécificités par fabricant.
 */
export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  sector: string;
  category: string;
  subCategory: string | null;
  year: number;
  price: number;
  description: string;
  detailedDescription: string;
  images: string[];
  url: string;
  attributes: Record<string, string>;
};

/**
 * Critères de recherche dans le catalogue.
 */
export type CatalogSearchCriteria = {
  sector?: string;
  brands?: string[];
  categories?: string[];
  subcategories?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  attributes?: Record<string, string>;
  limit?: number;
};
