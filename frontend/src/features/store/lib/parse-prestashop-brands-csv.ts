import { findTagCaseInsensitive, shopTagSchema } from './shopSchemas';

/** Résultat de l’extraction des marques depuis un CSV PrestaShop. */
export interface ParsePrestashopBrandsCsvResult {
  brands: string[];
  skippedInactive: number;
  skippedInvalid: number;
  skippedDuplicate: number;
}

/** Résultat de la fusion avec les marques déjà présentes. */
export interface MergeBrandsResult {
  brands: string[];
  added: number;
  alreadyPresent: number;
}

const CSV_DELIMITER = ';';
/** En-têtes FR/EN d’export marques PrestaShop. */
const NAME_HEADERS = new Set(['nom', 'name']);
const ACTIVE_HEADERS = new Set(['activé', 'active']);

/**
 * Découpe une ligne CSV avec délimiteur `;` et support des champs entre guillemets
 * (y compris guillemets échappés `""`).
 */
export function parseSemicolonCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === undefined) continue;

    if (inQuotes) {
      if (char === '"') {
        const next = line[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === CSV_DELIMITER) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .replace(/^\uFEFF/, '')
    .toLocaleLowerCase();
}

function isTruthyActiveFlag(raw: string): boolean {
  const normalized = raw.trim().toLocaleLowerCase();
  return (
    normalized === '1' ||
    normalized === 'true' ||
    normalized === 'oui' ||
    normalized === 'yes' ||
    normalized === 'y'
  );
}

function splitCsvLines(csvText: string): string[] {
  const withoutBom = csvText.replace(/^\uFEFF/, '');
  return withoutBom
    .split(/\r\n|\n|\r/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '');
}

/**
 * Extrait les noms de marques d’un export CSV PrestaShop (colonne « Nom », filtre « Activé »).
 * @throws {Error} si le fichier est vide ou si la colonne « Nom » est absente
 */
export function parsePrestashopBrandsCsv(csvText: string): ParsePrestashopBrandsCsvResult {
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) {
    throw new Error('Le fichier CSV est vide.');
  }

  const headerLine = lines[0];
  if (headerLine === undefined) {
    throw new Error('Le fichier CSV est vide.');
  }

  const headers = parseSemicolonCsvLine(headerLine).map(normalizeHeader);
  const nameIndex = headers.findIndex((h) => NAME_HEADERS.has(h));
  if (nameIndex === -1) {
    throw new Error(
      'Colonne « Nom » introuvable. Vérifiez que le fichier est un export de marques PrestaShop.',
    );
  }

  const activeIndex = headers.findIndex((h) => ACTIVE_HEADERS.has(h));
  const hasActiveColumn = activeIndex !== -1;

  const brands: string[] = [];
  let skippedInactive = 0;
  let skippedInvalid = 0;
  let skippedDuplicate = 0;

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const line = lines[rowIndex];
    if (line === undefined) continue;

    const fields = parseSemicolonCsvLine(line);

    if (hasActiveColumn) {
      const activeRaw = fields[activeIndex] ?? '';
      if (!isTruthyActiveFlag(activeRaw)) {
        skippedInactive += 1;
        continue;
      }
    }

    const rawName = fields[nameIndex] ?? '';
    const parsed = shopTagSchema.safeParse(rawName);
    if (!parsed.success) {
      skippedInvalid += 1;
      continue;
    }

    if (findTagCaseInsensitive(brands, parsed.data)) {
      skippedDuplicate += 1;
      continue;
    }

    brands.push(parsed.data);
  }

  return { brands, skippedInactive, skippedInvalid, skippedDuplicate };
}

/**
 * Fusionne les marques importées avec la liste existante.
 * Déduplication insensible à la casse : conserve l’orthographe déjà présente, ordre = existant puis nouveaux.
 */
export function mergeBrands(existing: string[], imported: string[]): MergeBrandsResult {
  const brands = [...existing];
  let added = 0;
  let alreadyPresent = 0;

  for (const brand of imported) {
    if (findTagCaseInsensitive(brands, brand)) {
      alreadyPresent += 1;
      continue;
    }
    brands.push(brand);
    added += 1;
  }

  return { brands, added, alreadyPresent };
}
