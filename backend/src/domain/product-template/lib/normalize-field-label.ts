import type { ProductTemplateFieldType } from "../types/product-template.types";

/** Clé de comparaison pour fusionner des libellés pollués (ex. « Couleur : » → « couleur »). */
export function normalizeFieldLabelForDedup(name: string): string {
  let s = name.replace(/\s+/g, " ").trim().toLowerCase();
  s = s.replace(/[*:]+$/g, "").trim();
  return s;
}

/** Libellé affiché : sans espaces parasites ni « : » / « * » en fin. */
export function sanitizeFieldDisplayLabel(name: string): string {
  return name.replace(/\s+/g, " ").trim().replace(/[*:]+$/g, "").trim();
}

/** Première lettre de chaque mot en majuscule (libellés issus du DOM). */
export function capitalizeWordsFr(label: string): string {
  const s = sanitizeFieldDisplayLabel(label);
  if (!s) return s;
  return s
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1);
    })
    .join(" ");
}

/** Libellé prêt pour l’export : nettoyage + capitalisation. */
export function formatFieldDisplayLabel(name: string): string {
  return capitalizeWordsFr(name);
}

const NUMERIC_WITH_UNIT =
  /^[\d.,]+\s*(m²|m2|m\b|cm|mm|kg|g|l|ml|cl|%|€|eur|euro|surfs?|voile)?$/i;
const SHORT_VARIANT_CODE = /^[A-Z]\d{1,3}$/i;
const GROUP_INPUT_NAME = /^group[\s_[]/i;

/**
 * Détecte une valeur d’option variante (ex. « 5.7 m² », « C1 ») prise à tort pour un libellé.
 */
export function isLikelyVariantOptionValue(label: string): boolean {
  const s = label.replace(/\s+/g, " ").trim();
  if (!s || s.length > 80) return false;
  if (GROUP_INPUT_NAME.test(s)) return true;
  if (/^[\d.,]+$/.test(s)) return true;
  if (NUMERIC_WITH_UNIT.test(s)) return true;
  if (SHORT_VARIANT_CODE.test(s)) return true;
  if (/^[\d.,]+\s*[^\d\s]{1,6}$/i.test(s) && /\d/.test(s)) return true;
  return false;
}

const VARIANT_COLOR = /\b(couleur|color|colour)\b/i;
const VARIANT_SIZE = /\b(taille|size|pointure|surface|voile)\b/i;

/** Infère le type d’un attribut variante PrestaShop à partir du libellé. */
export function inferVariantFieldType(label: string): ProductTemplateFieldType {
  const key = normalizeFieldLabelForDedup(label);
  if (VARIANT_COLOR.test(key)) return "color";
  if (VARIANT_SIZE.test(key)) return "size";
  return "enum";
}

const TYPE_MERGE_PRIORITY: Partial<Record<ProductTemplateFieldType, number>> = {
  color: 50,
  size: 50,
  price: 45,
  reference: 40,
  image: 40,
  weight: 35,
  rich_text: 30,
  long_text: 25,
  enum: 20,
  multi_enum: 20,
  number: 15,
  text: 10,
};

export function fieldTypeMergePriority(type: ProductTemplateFieldType): number {
  return TYPE_MERGE_PRIORITY[type] ?? 12;
}
