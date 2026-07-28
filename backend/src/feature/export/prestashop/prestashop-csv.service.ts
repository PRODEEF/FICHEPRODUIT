import { Injectable } from "@nestjs/common";
import { stringify } from "csv-stringify";
import { stringify as stringifySync } from "csv-stringify/sync";
import { Readable } from "node:stream";

const UTF8_BOM = "\uFEFF";

/**
 * Génération CSV PrestaShop via csv-stringify :
 * séparateur `;`, UTF-8 avec BOM, échappement RFC 4180.
 */
@Injectable()
export class PrestashopCsvService {
  /**
   * Construit le document CSV complet (avec BOM) — utile aux tests et petits volumes.
   */
  build(rows: Array<Record<string, string>>, headers: readonly string[]): string {
    const columns = [...headers];
    const records = rows.map((row) => columns.map((h) => row[h] ?? ""));
    return stringifySync(records, {
      header: true,
      columns,
      delimiter: ";",
      bom: true,
      cast: {
        string: (value) => (value === null || value === undefined ? "" : String(value)),
      },
    });
  }

  /**
   * Stream CSV (BOM + lignes) pour réponse HTTP Fastify.
   */
  toStream(rows: Array<Record<string, string>>, headers: readonly string[]): Readable {
    const columns = [...headers];
    const stringifier = stringify({
      header: true,
      columns,
      delimiter: ";",
      bom: true,
      cast: {
        string: (value) => (value === null || value === undefined ? "" : String(value)),
      },
    });

    const source = Readable.from(
      rows.map((row) => Object.fromEntries(columns.map((h) => [h, row[h] ?? ""]))),
    );

    return source.pipe(stringifier);
  }

  /** Indique si le contenu commence par le BOM UTF-8. */
  static hasBom(csv: string): boolean {
    return csv.startsWith(UTF8_BOM);
  }
}
