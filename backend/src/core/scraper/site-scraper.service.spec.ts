import { SiteScraperService } from "./site-scraper.service";

describe("SiteScraperService", () => {
  const service = new SiteScraperService();

  describe("detectCms", () => {
    it("détecte Shopify", () => {
      expect(service.detectCms('<link href="https://cdn.shopify.com/s/files/1.css">')).toBe(
        "shopify",
      );
    });

    it("détecte WooCommerce", () => {
      expect(
        service.detectCms('<script src="/wp-content/plugins/woocommerce/assets/js.js"></script>'),
      ).toBe("woocommerce");
    });

    it("détecte PrestaShop", () => {
      expect(service.detectCms('<script src="/modules/ps_shoppingcart/js.js"></script>')).toBe(
        "prestashop",
      );
    });

    it("retourne unknown sinon", () => {
      expect(service.detectCms("<html><body>boutique maison</body></html>")).toBe("unknown");
    });
  });

  describe("extractTitle", () => {
    it("extrait le titre HTML", () => {
      expect(service.extractTitle("<html><head><title> Ma boutique </title></head></html>")).toBe(
        "Ma boutique",
      );
    });

    it("retourne une chaîne vide sans balise title", () => {
      expect(service.extractTitle("<html><body>x</body></html>")).toBe("");
    });
  });

  describe("extractTextSample", () => {
    it("concatène meta description et texte body", () => {
      const html = `
        <html><head><meta name="description" content="Desc boutique"></head>
        <body><script>ignore()</script><p>Hello world</p></body></html>`;
      const sample = service.extractTextSample(html);
      expect(sample).toContain("Desc boutique");
      expect(sample).toContain("Hello world");
      expect(sample).not.toContain("ignore()");
    });
  });

  describe("normalizeSiteUrl", () => {
    it("ajoute https et retire le slash final", () => {
      expect(service.normalizeSiteUrl("example.com/")).toBe("https://example.com");
    });

    it("conserve le schéma fourni", () => {
      expect(service.normalizeSiteUrl("http://shop.test/path/")).toBe("http://shop.test/path");
    });

    it("lève une erreur pour une URL invalide", () => {
      expect(() => service.normalizeSiteUrl("not a url")).toThrow();
    });
  });
});
