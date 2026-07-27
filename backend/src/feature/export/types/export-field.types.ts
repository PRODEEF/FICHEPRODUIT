/**
 * Types autorisés pour un champ d’export CSV (PrestaShop / Shopify).
 */
export const EXPORT_FIELD_TYPES = [
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

export type ExportFieldType = (typeof EXPORT_FIELD_TYPES)[number];

export type ExportField = {
  name: string;
  type: ExportFieldType;
  required: boolean;
  order: number;
};

/**
 * Colonnes catalogue standards — mappées directement via DIRECT_MAPPINGS (field-mapper).
 */
export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
  { name: "name", type: "text", required: true, order: 0 },
  { name: "brand", type: "text", required: true, order: 1 },
  { name: "price", type: "price", required: true, order: 2 },
  { name: "category", type: "text", required: true, order: 3 },
  { name: "description", type: "long_text", required: false, order: 4 },
  { name: "detailed_description", type: "rich_text", required: false, order: 5 },
  { name: "images", type: "image", required: false, order: 6 },
  { name: "url", type: "url", required: true, order: 7 },
  { name: "year", type: "number", required: false, order: 8 },
];
