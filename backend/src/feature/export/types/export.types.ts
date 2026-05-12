/**
 * Paramètres d’une demande d’export CSV (corps HTTP distinct du résultat renvoyé au client).
 */
export type ExportRequest = {
  productIds: string[];
  templateId: string;
  shopId: string;
};

/**
 * Valeur résolue pour une colonne du template, avec traçabilité de la source (mappage direct vs IA).
 */
export type MappedField = {
  templateFieldName: string;
  value: string;
  source: "direct" | "ai";
};

/**
 * Ligne logique d’export : un produit et l’ensemble des champs mappés pour ce template.
 */
export type MappedProduct = {
  productId: string;
  fields: MappedField[];
};

/**
 * Résultat interne après génération ; le contrôleur n’expose que le CSV brut en réponse HTTP.
 */
export type ExportResult = {
  csv: string;
  filename: string;
  rowCount: number;
};
