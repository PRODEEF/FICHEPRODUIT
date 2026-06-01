/**
 * Types autorisés pour un champ de fiche (PrestaShop / Shopify / export CSV).
 */
export const FIELD_TYPES = [
  "text",
  "long_text",
  "rich_text",
  "number",
  "price",
  "percentage",
  "boolean",
  "date",
  "datetime",
  "url",
  "email",
  "phone",
  "enum",
  "multi_enum",
  "reference",
  "image",
  "file",
  "color",
  "size",
  "weight",
  "dimension",
  "country",
  "currency",
  "json",
] as const;

export type ProductTemplateFieldType = (typeof FIELD_TYPES)[number];

export type ProductTemplateField = {
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
  order: number;
};

export type ProductTemplate = {
  id: string;
  name: string;
  shopId: string;
  fields: ProductTemplateField[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductTemplate = {
  name: string;
  shopId: string;
  fields: Omit<ProductTemplateField, "order">[];
};

export type UpdateProductTemplate = {
  name?: string;
  fields?: Omit<ProductTemplateField, "order">[];
};

export type ScrapeFieldsResult = {
  fields: ProductTemplateField[];
  /** Valeurs exemple extraites de la page, indexées par nom de champ. */
  sampleValues: Record<string, string>;
  warnings: { code: string; message: string }[];
};

export type RefineFieldsResult = {
  fields: ProductTemplateField[];
};
