import type { ProductTemplateFieldType } from '@types-api';

export type { ProductTemplateFieldType };

// ─── Types (absorbe productTemplateTypes.ts) ──────────────────────────────────

export type ProductTemplateField = {
  name: string;
  type: ProductTemplateFieldType;
  required: boolean;
  order?: number;
};

export type ProductTemplateRow = {
  id: string;
  client_id: string;
  name: string;
  fields: ProductTemplateField[];
  created_at: string;
  updated_at: string;
};

// ─── Labels et options (absorbe productTemplateFieldLabels.ts) ────────────────

const LABELS: Record<ProductTemplateFieldType, string> = {
  text: 'Texte court',
  long_text: 'Texte long',
  rich_text: 'Texte riche (HTML)',
  number: 'Nombre',
  price: 'Prix',
  percentage: 'Pourcentage',
  boolean: 'Oui / Non',
  date: 'Date',
  datetime: 'Date et heure',
  url: 'URL',
  email: 'E-mail',
  phone: 'Téléphone',
  enum: 'Liste (une valeur)',
  multi_enum: 'Liste (plusieurs valeurs)',
  reference: 'Référence (SKU, EAN…)',
  image: 'Image (URL ou fichier)',
  file: 'Fichier',
  color: 'Couleur',
  size: 'Taille',
  weight: 'Poids',
  dimension: 'Dimensions',
  country: 'Pays',
  currency: 'Devise',
  json: 'JSON',
};

export const PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS: {
  value: ProductTemplateFieldType;
  label: string;
}[] = (
  [
    'text',
    'long_text',
    'rich_text',
    'number',
    'price',
    'percentage',
    'weight',
    'dimension',
    'boolean',
    'date',
    'datetime',
    'url',
    'image',
    'email',
    'phone',
    'reference',
    'enum',
    'multi_enum',
    'color',
    'size',
    'country',
    'currency',
    'file',
    'json',
  ] as const satisfies readonly ProductTemplateFieldType[]
).map((value) => ({ value, label: LABELS[value] }));

export function productTemplateFieldTypeLabel(t: ProductTemplateFieldType): string {
  return LABELS[t];
}

/** Convertit une valeur legacy BD/API vers le `ProductTemplateFieldType` courant (ex. `html` → `rich_text`). */
export function normalizeProductTemplateFieldType(raw: string): ProductTemplateFieldType {
  if (raw === 'html') return 'rich_text';
  const options = PRODUCT_TEMPLATE_FIELD_TYPE_OPTIONS.map((o) => o.value);
  if (options.includes(raw as ProductTemplateFieldType)) {
    return raw as ProductTemplateFieldType;
  }
  return 'text';
}
