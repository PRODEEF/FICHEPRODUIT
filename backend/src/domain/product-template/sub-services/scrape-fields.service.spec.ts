import { BadRequestException } from "@nestjs/common";
import {
  assertUrlSafeForServerFetch,
  fetchHtmlSafeForServer,
} from "../../../core/scraper/scrape-url-policy";
import { ScrapeFieldsService } from "./scrape-fields.service";

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

describe("ScrapeFieldsService", () => {
  let service: ScrapeFieldsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScrapeFieldsService();
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

  it("extrait champs et sampleValues depuis JSON-LD Product", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: PRODUCT_JSON_LD_HTML,
      finalUrl: "https://shop.example.com/product/1",
    });

    const result = await service.scrape("https://shop.example.com/product/1");

    expect(result.warnings.some((w) => w.code === "FETCH_FAILED")).toBe(false);
    expect(result.fields.map((f) => f.name)).toEqual(
      expect.arrayContaining([
        "Product name",
        "SKU",
        "Price (EUR)",
        "Description",
        "Image URL",
        "Matière",
      ]),
    );
    expect(result.sampleValues["Product name"]).toBe("Chaise Bureau");
    expect(result.sampleValues["SKU"]).toBe("CH-42");
    expect(result.sampleValues["Price (EUR)"]).toBe("199.99");
    expect(result.sampleValues["Description"]).toBe("Chaise ergonomique réglable.");
    expect(result.sampleValues["Image URL"]).toBe("https://cdn.example.com/chair.jpg");
    expect(result.sampleValues["Matière"]).toBe("Mesh");
  });

  it("ajoute un avertissement NO_JSONLD et extrait les caractéristiques PrestaShop", async () => {
    fetchHtml.mockResolvedValue({
      ok: true,
      html: PRESTASHOP_FEATURES_HTML,
      finalUrl: "https://prestashop.example.com/p/1",
    });

    const result = await service.scrape("https://prestashop.example.com/p/1");

    expect(result.warnings.some((w) => w.code === "NO_JSONLD")).toBe(true);
    expect(result.fields.map((f) => f.name)).toEqual(
      expect.arrayContaining(["Poids", "Couleur"]),
    );
    expect(result.sampleValues["Poids"]).toBe("12 kg");
    expect(result.sampleValues["Couleur"]).toBe("Noir");
  });

  it("retourne des listes vides si le fetch échoue", async () => {
    fetchHtml.mockResolvedValue({ ok: false, error: "timeout" });

    const result = await service.scrape("https://shop.example.com/slow");

    expect(result.fields).toEqual([]);
    expect(result.sampleValues).toEqual({});
    expect(result.warnings).toEqual([{ code: "FETCH_FAILED", message: "timeout" }]);
  });
});
