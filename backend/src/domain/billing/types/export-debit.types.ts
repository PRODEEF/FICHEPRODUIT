/** Produit minimal pour le calcul de débit crédit à l'export. */
export type ExportDebitProduct = {
  id: string;
  price: number;
};

export type ExportDebitComputation = {
  required: number;
  available: number;
  billableProductIds: string[];
};

export type ExportDebitMetadata = {
  productIds: string[];
  exportRowCount: number;
};
