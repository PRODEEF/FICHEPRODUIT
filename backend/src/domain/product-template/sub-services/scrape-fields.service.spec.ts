import { BadRequestException } from "@nestjs/common";
import {
  assertUrlSafeForServerFetch,
  fetchHtmlSafeForServer,
} from "../../../core/scraper/scrape-url-policy";
import { JSON_LD_FIELD_LABELS } from "../lib/json-ld-field-labels-fr";
import { ScrapeFieldsService } from "./scrape-fields.service";
import { ScrapeFieldsTraceService } from "./scrape-fields-trace.service";
import { ConfigService } from "@nestjs/config";

jest.mock("../../../core/scraper/scrape-url-policy", () => ({
  assertUrlSafeForServerFetch: jest.fn(),
  fetchHtmlSafeForServer: jest.fn(),
}));

const assertUrlSafe = jest.mocked(assertUrlSafeForServerFetch);
const fetchHtml = jest.mocked(fetchHtmlSafeForServer);

const PRODUCT_JSON_LD_HTML = `<!DOCTYPE html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Chaise Bureau",
    "sku": "CH-42",
    "description": "Chaise ergonomique réglable.",
    "image": "https://cdn.example.com/chair.jpg",
    "offers": {
      "@type": "Offer",
      "price": "199.99",
      "priceCurrency": "EUR"
    },
    "additionalProperty": [
      { "@type": "PropertyValue", "name": "Matière", "value": "Mesh" }
    ]
  }
  </script>
</head>
<body></body>
</html>`;

const PRESTASHOP_FEATURES_HTML = `<!DOCTYPE html>
<html>
<body>
  <table class="product-features">
    <tr><th>Poids</th><td>12 kg</td></tr>
    <tr><th>Couleur</th><td>Noir</td></tr>
  </table>
</body>
</html>`;

const VARIANT_OPTION_VALUES_HTML = `<!DOCTYPE html>
<html>
<body>
  <div class="product-variants">
    <div class="product-variants-item">
      <span class="control-label">surface voile :</span>
      <select name="group[1]">
        <option value="1507" selected>5.7 m²</option>
        <option value="1508">6.0 m²</option>
      </select>
      <ul class="product-variants-list">
        <li><span class="attribute-name">5.7 m²</span></li>
        <li><span class="attribute-name">6.0 m²</span></li>
      </ul>
    </div>
    <div class="product-variants-item">
      <span class="control-label">couleur :</span>
      <input type="radio" name="group[2]" value="2131" checked aria-label="C1" />
      <ul class="product-variants-list">
        <li><span class="attribute-name">C1</span></li>
      </ul>
    </div>
  </div>
</body>
</html>`;

const VARIANT_LABEL_DUPLICATE_HTML = `<!DOCTYPE html>
<html>
<body>
  <div class="product-variants">
    <div class="product-variants-item">
      <span class="control-label">Couleur :</span>
      <select name="group[1]">
        <option value="1" selected>Noir</option>
        <option value="2">Blanc</option>
      </select>
    </div>
  </div>
  <table class="product-features">
    <tr><th>Couleur</th><td>Noir</td></tr>
  </table>
</body>
</html>`;

describe("ScrapeFieldsService", () => {
  let service: ScrapeFieldsService;
  let traceService: ScrapeFieldsTraceService;
  let emitTraceSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    traceService = new ScrapeFieldsTraceService(new ConfigService<Record<string, unknown>>({}));
    emitTraceSpy = jest.spyOn(traceService, "emitTrace").mockResolvedValue(undefined);
    service = new ScrapeFieldsService(traceService);
    assertUrlSafe.mockResolvedValue({ ok: true });
  });

  it("lève BadRequestException si l’URL est vide", async () => {
    await expect(service.scrape("   ")).rejects.toBeInstanceOf(BadRequestException);
    expect(fetchHtml).not.toHaveBeenCalled();
  });

  it("lève BadRequestException si l’URL est refusée par la politique SSRF", async () => {
    assertUrlSafe.mockResolvedValue({ ok: false, reason: "Adresse IP non autorisée" });

    await expect(service.scrape("http://127.0.0.1/product")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchHtml).not.toHaveBeenCalled();
  });

  it("extrait champs et sampleValues depuis JSON-LD Product (libellés FR)", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: PRODUCT_JSON_LD_HTML,
      finalUrl: "https://shop.example.com/product/1",
    });

    const result = await service.scrape("https://shop.example.com/product/1");

    expect(result.warnings.some((w) => w.code === "FETCH_FAILED")).toBe(false);
    expect(result.fields.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        JSON_LD_FIELD_LABELS.productName,
        JSON_LD_FIELD_LABELS.sku,
        "Prix (EUR)",
        JSON_LD_FIELD_LABELS.shortDescription,
        JSON_LD_FIELD_LABELS.imageUrl,
        "Matière",
      ]),
    );
    expect(result.sampleValues[JSON_LD_FIELD_LABELS.productName]).toBe("Chaise Bureau");
    expect(result.sampleValues[JSON_LD_FIELD_LABELS.sku]).toBe("CH-42");
    expect(result.sampleValues["Prix (EUR)"]).toBe("199.99");
    expect(result.sampleValues[JSON_LD_FIELD_LABELS.shortDescription]).toBe(
      "Chaise ergonomique réglable.",
    );
    expect(result.sampleValues[JSON_LD_FIELD_LABELS.imageUrl]).toBe(
      "https://cdn.example.com/chair.jpg",
    );
    expect(result.sampleValues["Matière"]).toBe("Mesh");
    expect(emitTraceSpy).toHaveBeenCalled();
  });

  it("ajoute un avertissement NO_JSONLD (message FR) et extrait les caractéristiques PrestaShop", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: PRESTASHOP_FEATURES_HTML,
      finalUrl: "https://prestashop.example.com/p/1",
    });

    const result = await service.scrape("https://prestashop.example.com/p/1");

    const noJsonLd = result.warnings.find((w) => w.code === "NO_JSONLD");
    expect(noJsonLd?.message).toMatch(/ld\+json/i);
    expect(result.fields.map((f) => f.name)).toEqual(expect.arrayContaining(["Poids", "Couleur"]));
    expect(result.sampleValues["Poids"]).toBe("12 kg");
    expect(result.sampleValues["Couleur"]).toBe("Noir");
  });

  it("ignore les valeurs d’option (5.7 m², C1) comme libellés de champs", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: VARIANT_OPTION_VALUES_HTML,
      finalUrl: "https://shop.example.com/voile",
    });

    const result = await service.scrape("https://shop.example.com/voile");
    const names = result.fields.map((f) => f.name);

    expect(names).not.toContain("5.7 m²");
    expect(names).not.toContain("C1");
    expect(names).toContain("Surface Voile");
    expect(names).toContain("Couleur");
    expect(result.sampleValues["Surface Voile"]).toBe("5.7 m²");
    expect(result.sampleValues["Couleur"]).toBe("C1");
  });

  it("fusionne Couleur et Couleur : après normalisation", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: VARIANT_LABEL_DUPLICATE_HTML,
      finalUrl: "https://prestashop.example.com/p/2",
    });

    const result = await service.scrape("https://prestashop.example.com/p/2");

    const couleurFields = result.fields.filter((f) => f.name.toLowerCase().startsWith("couleur"));
    expect(couleurFields).toHaveLength(1);
    expect(couleurFields[0]?.name).toBe("Couleur");
    expect(result.fields.map((f) => f.name)).not.toContain("Couleur :");
  });

  it("retourne des listes vides si le fetch échoue", async () => {
    fetchHtml.mockResolvedValue({ ok: false, error: "timeout" });

    const result = await service.scrape("https://shop.example.com/slow");

    expect(result.fields).toEqual([]);
    expect(result.sampleValues).toEqual({});
    expect(result.warnings).toEqual([{ code: "FETCH_FAILED", message: "timeout" }]);
    expect(emitTraceSpy).not.toHaveBeenCalled();
  });
});
