import { ConfigService } from "@nestjs/config";
import { ScrapeFieldsTraceService } from "./scrape-fields-trace.service";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe("ScrapeFieldsTraceService", () => {
  let service: ScrapeFieldsTraceService;
  let config: ConfigService<Record<string, unknown>>;
  let getSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    config = new ConfigService<Record<string, unknown>>({});
    getSpy = jest.spyOn(config, "get");
    service = new ScrapeFieldsTraceService(config);
  });

  it("n'écrit rien quand la trace est désactivée", async () => {
    getSpy.mockImplementation((key: string, fallback?: unknown) => {
      if (key === "scrapeFieldsTraceEnabled") return false;
      return fallback;
    });

    await service.emitTrace(
      "https://shop.example.com/p/1",
      "https://shop.example.com/p/1",
      {
        fields: [{ name: "Product name", type: "text", required: false, order: 0 }],
        sampleValues: { "Product name": "Vélo test" },
        warnings: [],
      },
      [],
      {
        json_ld: 1,
        prestashop_features: 0,
        prestashop_variants: 0,
        prestashop_details: 0,
      },
    );

    expect(getSpy).toHaveBeenCalledWith("scrapeFieldsTraceEnabled", false);
  });

  it("construit une trace quand la trace est activée", async () => {
    getSpy.mockImplementation((key: string, fallback?: unknown) => {
      if (key === "scrapeFieldsTraceEnabled") return true;
      if (key === "scrapeFieldsTraceDir") return "";
      return fallback;
    });

    await expect(
      service.emitTrace(
        "https://shop.example.com/p/1",
        "https://shop.example.com/p/1",
        {
          fields: [
            { name: "Product name", type: "text", required: false, order: 0 },
            { name: "Price (EUR)", type: "price", required: false, order: 1 },
          ],
          sampleValues: { "Product name": "Vélo test" },
          warnings: [{ code: "NO_JSONLD", message: "Aucun bloc JSON-LD" }],
        },
        [],
        {
          json_ld: 2,
          prestashop_features: 0,
          prestashop_variants: 0,
          prestashop_details: 0,
        },
      ),
    ).resolves.toBeUndefined();
  });
});
