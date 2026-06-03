import type { ScrapeFieldsResult } from "./product-template.types";

export type ScrapeFieldsDetectedValue = {
  fieldName: string;
  value: string;
};

export type ScrapeFieldExtractorId =
  | "json_ld"
  | "prestashop_features"
  | "prestashop_variants"
  | "prestashop_details";

export type ScrapeFieldMapping = {
  fieldName: string;
  fieldType?: string;
  extractor: ScrapeFieldExtractorId;
  sitePath?: string;
  siteLabel?: string;
  domHint?: string;
  sampleValue?: string;
  mergeStatus: "kept" | "dropped_duplicate";
  keptBy?: ScrapeFieldExtractorId;
};

export type ScrapeFieldsTraceReport = {
  scrapedAt: string;
  url: string;
  finalUrl: string;
  summary: {
    fieldCount: number;
    byExtractor: Record<ScrapeFieldExtractorId, number>;
  };
  mappings: ScrapeFieldMapping[];
  detectedValues: ScrapeFieldsDetectedValue[];
  fieldsWithoutValue: string[];
  warnings: ScrapeFieldsResult["warnings"];
  lineCount: number;
  withValueCount: number;
};

type BuildTraceInput = {
  url: string;
  finalUrl: string;
  scrapedAt: Date;
  result: ScrapeFieldsResult;
  mappings: ScrapeFieldMapping[];
  byExtractor: Record<ScrapeFieldExtractorId, number>;
};

export function buildScrapeFieldsTraceReport(input: BuildTraceInput): ScrapeFieldsTraceReport {
  const detectedValues: ScrapeFieldsDetectedValue[] = [];
  const fieldsWithoutValue: string[] = [];

  for (const field of input.result.fields) {
    const value = input.result.sampleValues[field.name];
    if (value) {
      detectedValues.push({ fieldName: field.name, value });
      continue;
    }
    fieldsWithoutValue.push(field.name);
  }

  return {
    scrapedAt: input.scrapedAt.toISOString(),
    url: input.url,
    finalUrl: input.finalUrl,
    summary: {
      fieldCount: input.result.fields.length,
      byExtractor: input.byExtractor,
    },
    mappings: input.mappings,
    detectedValues,
    fieldsWithoutValue,
    warnings: input.result.warnings,
    lineCount: input.result.fields.length,
    withValueCount: detectedValues.length,
  };
}
