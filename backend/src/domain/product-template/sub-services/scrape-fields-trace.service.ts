import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ScrapeFieldsResult } from "../types/product-template.types";
import {
  buildScrapeFieldsTraceReport,
  type ScrapeFieldExtractorId,
  type ScrapeFieldMapping,
} from "../types/scrape-fields-trace.types";

@Injectable()
export class ScrapeFieldsTraceService {
  private readonly logger = new Logger(ScrapeFieldsTraceService.name);

  constructor(private readonly configService: ConfigService) {}

  async emitTrace(
    url: string,
    finalUrl: string,
    result: ScrapeFieldsResult,
    mappings: ScrapeFieldMapping[],
    byExtractor: Record<ScrapeFieldExtractorId, number>,
  ): Promise<void> {
    const traceEnabled = this.configService.get<boolean>("scrapeFieldsTraceEnabled", false);
    if (!traceEnabled) {
      return;
    }

    const report = buildScrapeFieldsTraceReport({
      url,
      finalUrl,
      scrapedAt: new Date(),
      result,
      mappings,
      byExtractor,
    });

    this.logger.log(
      `[scrape-fields] url=${url} fields=${report.lineCount} withValue=${report.withValueCount} warnings=${report.warnings.length}`,
    );
    for (const entry of report.detectedValues) {
      this.logger.log(`${entry.fieldName}: ${entry.value}`);
    }
    for (const fieldName of report.fieldsWithoutValue) {
      this.logger.log(`${fieldName}: (aucune valeur sur la page)`);
    }

    const traceDir = this.configService.get<string>("scrapeFieldsTraceDir", "").trim();
    if (!traceDir) {
      return;
    }

    try {
      await mkdir(traceDir, { recursive: true });
      const stamp = report.scrapedAt.replace(/[:.]/g, "-");
      const slug = this.slugify(url);
      const baseName = `${stamp}_${slug}`;
      const jsonPath = join(traceDir, `${baseName}.json`);

      await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      this.logger.warn(`Impossible d'écrire les traces scrape-fields: ${message}`);
    }
  }

  private slugify(input: string): string {
    const base = input.toLowerCase().replace(/^https?:\/\//, "");
    const slug = base.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug.length > 0 ? slug.slice(0, 80) : "unknown-url";
  }
}
