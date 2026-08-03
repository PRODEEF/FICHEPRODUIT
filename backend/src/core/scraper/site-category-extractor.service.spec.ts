import { ConfigService } from "@nestjs/config";

import { fetchHtmlSafeForServer } from "./scrape-url-policy";
import { SiteCategoryExtractorService } from "./site-category-extractor.service";

jest.mock("./scrape-url-policy", () => ({
  fetchHtmlSafeForServer: jest.fn(),
}));

const fetchHtmlSafeForServerMock = fetchHtmlSafeForServer as jest.MockedFunction<
  typeof fetchHtmlSafeForServer
>;

describe("SiteCategoryExtractorService", () => {
  const config = {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;

  const service = new SiteCategoryExtractorService(config);

  beforeEach(() => {
    fetchHtmlSafeForServerMock.mockReset();
  });

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

  it("extrait un mega-menu PrestaShop (popover > div > ul multi-colonnes)", async () => {
    const html = `
      <html><body>
        <div id="_desktop_top_menu">
          <ul id="top-menu">
            <li class="category">
              <a href="/categorie/glisse">Glisse</a>
              <div class="popover sub-menu js-sub-menu">
                <div class="container">
                  <div class="row">
                    <div class="col">
                      <ul>
                        <li><a href="/categorie/kitesurf">Kitesurf</a></li>
                      </ul>
                    </div>
                    <div class="col">
                      <ul>
                        <li><a href="/categorie/wingfoil">Wingfoil</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </li>
            <li class="category">
              <a href="/categorie/velo">Vélo</a>
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

    expect(tree.map((n) => n.name)).toEqual(["Glisse", "Vélo"]);
    expect(tree[0]?.children.map((c) => c.name).sort()).toEqual(["Kitesurf", "Wingfoil"]);
  });

  it("reconstruit une hiérarchie depuis des liens plats avec préfixes d’URL", async () => {
    const html = `
      <html><body>
        <nav>
          <a href="/categorie/glisse">Glisse</a>
          <a href="/categorie/glisse/kitesurf">Kitesurf</a>
          <a href="/categorie/glisse/wingfoil">Wingfoil</a>
          <a href="/categorie/velo">Vélo</a>
        </nav>
      </body></html>
    `;

    const tree = await service.extract({
      html,
      cms: "unknown",
      baseUrl: "https://flat.test",
    });

    expect(tree.map((n) => n.name).sort()).toEqual(["Glisse", "Vélo"]);
    const glisse = tree.find((n) => n.name === "Glisse");
    expect(glisse?.children.map((c) => c.name).sort()).toEqual(["Kitesurf", "Wingfoil"]);
  });

  it("conserve une liste plate si les URLs n’ont pas de préfixe parent/enfant", async () => {
    const html = `
      <html><body>
        <nav>
          <a href="/3-vetements">Vêtements</a>
          <a href="/6-accessoires">Accessoires</a>
          <a href="/9-chaussures">Chaussures</a>
        </nav>
      </body></html>
    `;

    const tree = await service.extract({
      html,
      cms: "unknown",
      baseUrl: "https://ids.test",
    });

    expect(tree.map((n) => n.name).sort()).toEqual(["Accessoires", "Chaussures", "Vêtements"]);
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it("tente un nettoyage IA sur un arbre entièrement plat (>= 8 nœuds)", async () => {
    const getMock = jest.fn((key: string, fallback?: string) => {
      if (key === "openaiApiKey") return "sk-test";
      if (key === "openaiModel") return fallback ?? "gpt-4o-mini";
      return undefined;
    });
    const aiService = new SiteCategoryExtractorService({
      get: getMock,
    } as unknown as ConfigService);

    const links = Array.from({ length: 8 }, (_, i) => {
      const n = i + 1;
      return `<a href="/cat-${n}">Catégorie ${n}</a>`;
    }).join("\n");

    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                categories: [
                  {
                    name: "Sport",
                    children: [{ name: "Running", children: [] }],
                  },
                ],
              }),
            },
          },
        ],
      }),
    } as Response);

    try {
      const tree = await aiService.extract({
        html: `<html><body><nav>${links}</nav></body></html>`,
        cms: "unknown",
        baseUrl: "https://ai-flat.test",
      });

      expect(fetchMock).toHaveBeenCalled();
      expect(tree.map((n) => n.name)).toEqual(["Sport"]);
      expect(tree[0]?.children.map((c) => c.name)).toEqual(["Running"]);
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("extrait un mega-menu ThemeVolty (.tv-sub-menu)", async () => {
    const html = `
      <div id="tvdesktop-megamenu">
        <div id="tv-menu-horizontal" class="tv-menu-horizontal">
          <ul class="menu-content">
            <li class="tvmega-menu-title">MENU</li>
            <li class="level-1 parent">
              <a href="https://shop.test/609-surf"><span>Surf</span></a>
              <div class="tv-sub-menu menu-dropdown">
                <div class="tv-menu-row row">
                  <div class="tv-menu-col">
                    <ul>
                      <li><a href="https://shop.test/609-surf">Surf</a></li>
                      <li><a href="https://shop.test/611-planches-surf">Planches Surf</a></li>
                      <li><a href="https://shop.test/612-surfs-mousse">Planche Surf Mousse</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li class="level-1 parent">
              <a href="https://shop.test/3991-wingfoil"><span>Wingfoil</span></a>
            </li>
          </ul>
        </div>
      </div>
    `;

    const tree = await service.extract({
      html,
      cms: "prestashop",
      baseUrl: "https://shop.test",
    });

    expect(tree.map((n) => n.name)).toEqual(["Surf", "Wingfoil"]);
    expect(tree[0]?.children.map((c) => c.name)).toEqual(["Planches Surf", "Planche Surf Mousse"]);
  });

  it("charge le megamenu ThemeVolty si la homepage n’a que des racines plates", async () => {
    const homepage = `
      <html><body>
        <script>var gettvcmsmegamenulink = "https:\\/\\/www.glissup.fr\\/module\\/tvcmsmegamenu\\/default";</script>
        <div id="tvdesktop-megamenu">
          <ul class="menu-content">
            <li class="level-1 parent"><a href="https://www.glissup.fr/609-surf"><span>Surf</span></a></li>
            <li class="level-1 parent"><a href="https://www.glissup.fr/3991-wingfoil"><span>Wingfoil</span></a></li>
          </ul>
        </div>
      </body></html>
    `;

    const megaHtml = `
      <div id="tv-menu-horizontal">
        <ul class="menu-content">
          <li class="level-1 parent">
            <a href="https://www.glissup.fr/609-surf"><span>Surf</span></a>
            <div class="tv-sub-menu menu-dropdown">
              <ul>
                <li><a href="https://www.glissup.fr/611-planches-surf">Planches Surf</a></li>
              </ul>
            </div>
          </li>
          <li class="level-1 parent">
            <a href="https://www.glissup.fr/3991-wingfoil">
              <span>Wingfoil</span>
              <span class="menu-subtitle">New</span>
            </a>
            <div class="tv-sub-menu menu-dropdown">
              <ul>
                <li><a href="https://www.glissup.fr/4000-ailes">Ailes de wingfoil</a></li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    `;

    fetchHtmlSafeForServerMock.mockResolvedValue({
      ok: true,
      html: megaHtml,
      finalUrl: "https://www.glissup.fr/module/tvcmsmegamenu/default",
    });

    const tree = await service.extract({
      html: homepage,
      cms: "prestashop",
      baseUrl: "https://www.glissup.fr",
    });

    expect(fetchHtmlSafeForServerMock).toHaveBeenCalledWith(
      "https://www.glissup.fr/module/tvcmsmegamenu/default",
      expect.any(Object),
    );
    expect(tree.map((n) => n.name)).toEqual(["Surf", "Wingfoil"]);
    expect(tree[0]?.children.map((c) => c.name)).toEqual(["Planches Surf"]);
    expect(tree[1]?.children.map((c) => c.name)).toEqual(["Ailes de wingfoil"]);
  });
});
