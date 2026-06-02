import { buildScrapeFieldsTraceReport } from "./scrape-fields-trace.types";
import type { ScrapeFieldsResult } from "./product-template.types";

describe("buildScrapeFieldsTraceReport", () => {
  it("construit les lignes avec valeur et liste les champs sans valeur", () => {
    const result: ScrapeFieldsResult = {
      fields: [
        { name: "Product name", type: "text", required: false, order: 0 },
        { name: "Price (EUR)", type: "price", required: false, order: 1 },
        { name: "Couleur", type: "text", required: false, order: 2 },
      ],
      sampleValues: {
        "Product name": "Vélo ELWING Ritmic Jumbo Blanc longtail",
        "Price (EUR)": "263.26",
      },
      warnings: [{ code: "NO_JSONLD", message: "No JSON-LD block found" }],
    };

    const report = buildScrapeFieldsTraceReport({
      url: "https://shop.example.com/products/velo",
      finalUrl: "https://shop.example.com/products/velo",
      scrapedAt: new Date("2026-06-02T08:30:00.000Z"),
      result,
      mappings: [
        {
          fieldName: "Product name",
          fieldType: "text",
          extractor: "json_ld",
          sitePath: "Product.name",
          mergeStatus: "kept",
          sampleValue: "Vélo ELWING Ritmic Jumbo Blanc longtail",
        },
      ],
      byExtractor: {
        json_ld: 2,
        prestashop_features: 1,
        prestashop_variants: 0,
        prestashop_details: 0,
      },
    });

    expect(report.scrapedAt).toBe("2026-06-02T08:30:00.000Z");
    expect(report.url).toBe("https://shop.example.com/products/velo");
    expect(report.finalUrl).toBe("https://shop.example.com/products/velo");
    expect(report.summary.byExtractor.json_ld).toBe(2);
    expect(report.mappings[0]?.extractor).toBe("json_ld");
    expect(report.detectedValues).toEqual([
      {
        fieldName: "Product name",
        value: "Vélo ELWING Ritmic Jumbo Blanc longtail",
      },
      {
        fieldName: "Price (EUR)",
        value: "263.26",
      },
    ]);
    expect(report.fieldsWithoutValue).toEqual(["Couleur"]);
    expect(report.warnings).toEqual([{ code: "NO_JSONLD", message: "No JSON-LD block found" }]);
    expect(report.withValueCount).toBe(2);
    expect(report.lineCount).toBe(3);
  });
});
