import { ConfigService } from "@nestjs/config";

import { SiteCategoryExtractorService } from "./site-category-extractor.service";

describe("SiteCategoryExtractorService", () => {
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;

  const service = new SiteCategoryExtractorService(config);

  it("extrait un menu PrestaShop imbriqué", async () => {
    const html = `
      <html><body>
        <div id="_desktop_top_menu">
          <ul id="top-menu">
            <li>
              <a href="/categorie/glisse">Glisse</a>
              <ul>
                <li><a href="/categorie/kitesurf">Kitesurf</a></li>
                <li><a href="/categorie/wingfoil">Wingfoil</a></li>
              </ul>
            </li>
            <li><a href="/categorie/velo">Vélo</a></li>
            <li><a href="/connexion">Mon compte</a></li>
            <li><a href="/panier">Panier</a></li>
          </ul>
        </div>
      </body></html>
    `;

    const tree = await service.extract({
      html,
      cms: "prestashop",
      baseUrl: "https://boutique.test",
    });

    expect(tree.map((n) => n.name)).toEqual(["Glisse", "Vélo"]);
    expect(tree[0]?.children.map((c) => c.name)).toEqual(["Kitesurf", "Wingfoil"]);
    expect(tree.every((n) => typeof n.id === "string" && n.id.length > 0)).toBe(true);
  });

  it("extrait un menu Shopify", async () => {
    const html = `
      <nav class="site-nav">
        <ul>
          <li><a href="/collections/chaussures">Chaussures</a></li>
          <li>
            <a href="/collections/vetements">Vêtements</a>
            <ul>
              <li><a href="/collections/manteaux">Manteaux</a></li>
            </ul>
          </li>
          <li><a href="/account">Login</a></li>
        </ul>
      </nav>
    `;

    const tree = await service.extract({
      html,
      cms: "shopify",
      baseUrl: "https://shop.example",
    });

    expect(tree.map((n) => n.name)).toEqual(["Chaussures", "Vêtements"]);
    expect(tree[1]?.children.map((c) => c.name)).toEqual(["Manteaux"]);
  });

  it("utilise le fallback nav générique", async () => {
    const html = `
      <nav>
        <ul>
          <li><a href="/catalog/outdoor">Outdoor</a>
            <ul><li><a href="/catalog/tentes">Tentes</a></li></ul>
          </li>
        </ul>
      </nav>
    `;

    const tree = await service.extract({
      html,
      cms: "unknown",
      baseUrl: "https://outdoor.test",
    });

    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe("Outdoor");
    expect(tree[0]?.children[0]?.name).toBe("Tentes");
  });

  it("retourne un arbre vide sans menu", async () => {
    const tree = await service.extract({
      html: "<html><body><p>Bonjour</p></body></html>",
      cms: "unknown",
      baseUrl: "https://empty.test",
    });
    expect(tree).toEqual([]);
  });

  it("fusionne les doublons au même niveau", async () => {
    const html = `
      <nav>
        <ul>
          <li><a href="/categorie/sport">Sport</a>
            <ul><li><a href="/categorie/running">Running</a></li></ul>
          </li>
          <li><a href="/categorie/sport-2">Sport</a>
            <ul><li><a href="/categorie/fitness">Fitness</a></li></ul>
          </li>
        </ul>
      </nav>
    `;

    const tree = await service.extract({
      html,
      cms: "unknown",
      baseUrl: "https://sport.test",
    });

    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe("Sport");
    expect(tree[0]?.children.map((c) => c.name).sort()).toEqual(["Fitness", "Running"]);
  });

  it("extrait un menu PrestaShop avec lien wrappé", async () => {
    const html = `
      <html><body>
        <div id="_desktop_top_menu">
          <ul id="top-menu" class="top-menu">
            <li class="category">
              <div class="popover">
                <a href="/3-vetements"><span>Vêtements</span></a>
              </div>
            </li>
            <li class="category">
              <a href="/6-accessoires"><span class="float-xs-left">Accessoires</span></a>
            </li>
          </ul>
        </div>
      </body></html>
    `;

    const tree = await service.extract({
      html,
      cms: "prestashop",
      baseUrl: "https://boutique.test",
    });

    expect(tree.map((n) => n.name).sort()).toEqual(["Accessoires", "Vêtements"]);
  });

  it("filtre wishlist/comparer et nettoie icônes + compteurs (Glissup-like)", async () => {
    const html = `
      <html><body>
        <div id="_desktop_top_menu">
          <ul id="top-menu">
            <li><a href="/categorie/glisse">Glisse</a></li>
            <li><a href="/module/blockwishlist/view">\uE07Dliste de souhaits(0 )</a></li>
            <li><a href="/products-comparison">\uE043 comparer (0)</a></li>
            <li><a href="/module/ps_emailsubscription/subscription">Newsletter</a></li>
          </ul>
        </div>
      </body></html>
    `;

    const tree = await service.extract({
      html,
      cms: "prestashop",
      baseUrl: "https://glissup.fr",
    });

    expect(tree.map((n) => n.name)).toEqual(["Glisse"]);
  });
});
