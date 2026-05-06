import type { ProductTemplateFieldType } from './productTemplates';

export function stripBom(text: string): string {
  if (text.length > 0 && text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

export function detectDelimiter(line: string): ',' | ';' | '\t' {
  const comma = (line.match(/,/g) ?? []).length;
  const semi = (line.match(/;/g) ?? []).length;
  const tab = (line.match(/\t/g) ?? []).length;
  if (semi >= comma && semi >= tab) return ';';
  if (tab >= comma && tab >= semi) return '\t';
  return ',';
}

export function parseDelimitedLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out.map((s) => s.replace(/^"|"$/g, ''));
}

export function extractHeaderLineFromCsv(text: string): string | null {
  const clean = stripBom(text).replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).map((l) => l.trimEnd());
  for (const line of lines) {
    if (line.trim().length > 0) return line;
  }
  return null;
}

export function parseCsvHeaders(text: string): string[] {
  const first = extractHeaderLineFromCsv(text);
  if (!first) return [];
  const delim = detectDelimiter(first);
  return parseDelimitedLine(first, delim).filter((h) => h.length > 0);
}

const SAMPLE_PREVIEW_MAX = 200;

export function parseCsvHeadersAndFirstDataRow(text: string): {
  headers: string[];
  sampleByHeader: Record<string, string>;
} | null {
  const clean = stripBom(text).replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).map((l) => l.trimEnd());
  const nonEmpty = lines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (nonEmpty.length === 0) return null;
  const headerLine = nonEmpty[0]!;
  const delim = detectDelimiter(headerLine);
  const headers = parseDelimitedLine(headerLine, delim).filter((h) => h.length > 0);
  if (headers.length === 0) return null;
  const sampleByHeader: Record<string, string> = {};
  if (nonEmpty.length >= 2) {
    const cells = parseDelimitedLine(nonEmpty[1]!, delim);
    headers.forEach((h, i) => {
      const v = (cells[i] ?? '').trim();
      if (v.length === 0) return;
      sampleByHeader[h] = v.length > SAMPLE_PREVIEW_MAX ? `${v.slice(0, SAMPLE_PREVIEW_MAX)}…` : v;
    });
  }
  return { headers, sampleByHeader };
}

export function inferProductTemplateFieldTypeFromCsvHeader(
  header: string,
): ProductTemplateFieldType {
  const raw = header.trim();
  const h = raw.toLowerCase().replace(/\s+/g, ' ');

  if (/\(0\/1\)/i.test(raw)) return 'boolean';
  if (/^meta\b/i.test(raw)) return 'text';
  if (/\bean13?\b/i.test(h)) return 'reference';
  if (/^reference\b/i.test(raw) || /\battribute\s+reference\b/i.test(h)) return 'reference';
  if (
    /yyyy-mm-dd/i.test(raw) ||
    /\bdiscount\s+from\b/i.test(raw) ||
    /\bdiscount\s+to\b/i.test(raw)
  ) {
    return 'date';
  }
  if (/image\s*urls?\b/i.test(h)) return 'image';
  if (/\burl\s+rewritten\b/i.test(h)) return 'url';
  if (h === 'description' || /^short\s+description\b/i.test(raw)) return 'rich_text';
  if (/\bdiscount\s+percent\b/i.test(raw)) return 'percentage';
  if (/\bweight\b/i.test(raw)) return 'weight';
  if (
    /\bprice\b/i.test(raw) ||
    /\bwholesale\b/i.test(raw) ||
    /\bdiscount\s+amount\b/i.test(raw) ||
    /^ecotax\b/i.test(h)
  ) {
    return 'price';
  }

  const looksNumeric =
    /\btax\s+rules\s+id\b/i.test(h) ||
    /\bquantity\b/i.test(raw) ||
    /\bminimal\s+quantity\b/i.test(h) ||
    /\battribute\s+price\s+impact\b/i.test(h) ||
    /\battribute\s+weight\s+impact\b/i.test(h) ||
    /\battribute\s+unit\s+impact\b/i.test(h) ||
    /\bid_image\b/i.test(h);

  if (looksNumeric) return 'number';
  if (/^category\b/i.test(raw)) return 'multi_enum';
  if (/^feature\s*-/i.test(raw)) return 'enum';
  if (/\battribute\s*\(/i.test(raw)) return 'enum';

  return 'text';
}
