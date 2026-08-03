import { randomUUID } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

import {
  SHOP_CATEGORY_MAX_DEPTH,
  SHOP_CATEGORY_MAX_NODES,
  SHOP_CATEGORY_NAME_MAX_LENGTH,
  type ShopCategoryNode,
} from "../../domain/shop/types/shop-category.types";
import type { CmsType } from "./scraper.types";

/** Au-delà de ce seuil, un nettoyage IA optionnel est tenté. */
const AI_CLEANUP_NODE_THRESHOLD = 40;

const NAV_DENYLIST = [
  "mon compte",
  "my account",
  "panier",
  "cart",
  "checkout",
  "connexion",
  "login",
  "sign in",
  "s'inscrire",
  "register",
  "contact",
  "aide",
  "help",
  "faq",
  "wishlist",
  "favoris",
  "liste de souhaits",
  "comparer",
  "compare",
  "recherche",
  "search",
  "blog",
  "actualité",
  "news",
  "livraison",
  "shipping",
  "paiement",
  "payment",
  "mentions légales",
  "cgv",
  "cgu",
  "privacy",
  "confidentialité",
  "cookies",
];

const CATEGORY_URL_HINTS = [
  "/categorie",
  "/category",
  "/categories",
  "/collection",
  "/collections",
  "/shop",
  "/boutique",
  "/catalog",
  "/catalogue",
  "/product-category",
  "/rayon",
];

const CMS_MENU_SELECTORS: Record<CmsType, string[]> = {
  prestashop: [
    "#_desktop_top_menu",
    "#top-menu",
    "ul.top-menu",
    ".top-menu",
    "#cbp-hrmenu",
    ".menu.js-top-menu",
    "nav .category",
  ],
  shopify: ["#SiteNav", ".site-nav", "nav.header__inline-menu", ".list-menu"],
  woocommerce: [".main-navigation", "#site-navigation", "nav.woocommerce", ".primary-menu"],
  unknown: [],
};

const FALLBACK_SELECTORS = ["header nav", "nav", "#navigation", ".navbar", ".menu", "header"];

type ExtractInput = {
  html: string;
  cms: CmsType;
  baseUrl: string;
};

type RawNavItem = {
  name: string;
  href: string;
  children: RawNavItem[];
};

@Injectable()
export class SiteCategoryExtractorService {
  private readonly logger = new Logger(SiteCategoryExtractorService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Extrait l’arborescence du menu de navigation depuis le HTML de la homepage.
   * Retourne `[]` si aucun menu exploitable n’est trouvé.
   */
  async extract(input: ExtractInput): Promise<ShopCategoryNode[]> {
    let tree: ShopCategoryNode[];

    try {
      tree = this.extractFromHtml(input);
    } catch (err) {
      this.logger.warn(
        `Extraction HTML des catégories échouée pour ${input.baseUrl}`,
        err instanceof Error ? err.message : err,
      );
      return [];
    }

    if (tree.length === 0) return [];

    const nodeCount = countNodes(tree);
    if (nodeCount > AI_CLEANUP_NODE_THRESHOLD) {
      const cleaned = await this.tryAiCleanup(tree, input.baseUrl);
      if (cleaned) tree = cleaned;
    }

    return truncateTree(dedupeSiblings(tree));
  }

  private extractFromHtml(input: ExtractInput): ShopCategoryNode[] {
    const $ = load(input.html);
    let baseHost: string;
    try {
      baseHost = new URL(input.baseUrl).hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      return [];
    }

    const selectors = [...(CMS_MENU_SELECTORS[input.cms] ?? []), ...FALLBACK_SELECTORS];
    for (const selector of selectors) {
      const root = $(selector).first();
      if (root.length === 0) continue;

      const items = this.parseListItems($, root, baseHost, 1);
      if (items.length > 0) {
        return items.map(rawToNode);
      }

      // Menu présent mais structure atypique : liens plats dans le conteneur
      const flat = this.parseFlatLinks($, root, baseHost);
      if (flat.length > 0) {
        return flat.map(rawToNode);
      }
    }

    return [];
  }

  private parseListItems(
    $: CheerioAPI,
    container: Cheerio<AnyNode>,
    baseHost: string,
    depth: number,
  ): RawNavItem[] {
    if (depth > SHOP_CATEGORY_MAX_DEPTH) return [];

    const listItems = container.children("ul").first().children("li");
    const source = listItems.length > 0 ? listItems : container.children("li");

    const items: RawNavItem[] = [];
    source.each((_, el) => {
      const li = $(el);
      const link = this.findPrimaryLink($, li);
      if (link.length === 0) return;

      const name = normalizeLabel(link.text());
      const href = (link.attr("href") ?? "").trim();
      if (!name || !this.isLikelyCategory(name, href, baseHost)) return;

      const nestedUl = li.children("ul");
      const children =
        nestedUl.length > 0
          ? this.parseListItems($, li, baseHost, depth + 1)
          : this.parseNestedMenus($, li, baseHost, depth + 1);

      items.push({ name, href, children });
    });

    return items;
  }

  /** Premier lien représentatif du item (PrestaShop wrappe parfois le `<a>`). */
  private findPrimaryLink($: CheerioAPI, li: Cheerio<AnyNode>): Cheerio<AnyNode> {
    const direct = li.children("a").first();
    if (direct.length > 0) return direct;
    const nested = li.find("> div > a, > span > a, > p > a").first();
    if (nested.length > 0) return nested;
    return li.find("a").first();
  }

  /** Fallback : liens internes du conteneur sans imposer `ul > li`. */
  private parseFlatLinks(
    $: CheerioAPI,
    container: Cheerio<AnyNode>,
    baseHost: string,
  ): RawNavItem[] {
    const items: RawNavItem[] = [];
    const seen = new Set<string>();
    container.find("a").each((_, el) => {
      if (items.length >= 30) return;
      const link = $(el);
      const name = normalizeLabel(link.text());
      const href = (link.attr("href") ?? "").trim();
      if (!name || !this.isLikelyCategory(name, href, baseHost)) return;
      const key = name.toLocaleLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ name, href, children: [] });
    });
    return items;
  }

  /** Menus PrestaShop/Shopify : sous-menus hors `ul` direct (div.popover, etc.). */
  private parseNestedMenus(
    $: CheerioAPI,
    li: Cheerio<AnyNode>,
    baseHost: string,
    depth: number,
  ): RawNavItem[] {
    if (depth > SHOP_CATEGORY_MAX_DEPTH) return [];

    const nested = li.find("> .popover, > .submenu, > .dropdown-menu, > .menu").first();
    if (nested.length === 0) return [];
    return this.parseListItems($, nested, baseHost, depth);
  }

  private isLikelyCategory(name: string, href: string, baseHost: string): boolean {
    const lower = name.toLowerCase();
    if (NAV_DENYLIST.some((d) => lower === d || lower.includes(d))) return false;
    if (href === "" || href === "#" || href.startsWith("javascript:")) return false;

    try {
      const absolute = new URL(href, `https://${baseHost}`);
      const host = absolute.hostname.replace(/^www\./i, "").toLowerCase();
      if (host !== baseHost) return false;

      const path = absolute.pathname.toLowerCase();
      if (path === "/" || path === "") {
        // Lien homepage avec label catégorie : on garde si le label n’est pas « Accueil »
        return !["accueil", "home", "maison"].includes(lower);
      }

      // Accepter les chemins catégorie ou tout chemin interne non-utilitaire
      if (CATEGORY_URL_HINTS.some((h) => path.includes(h))) return true;
      if (
        /\/(account|cart|checkout|login|register|contact|blog|search|compare|wishlist|module)\b/i.test(
          path,
        )
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private async tryAiCleanup(
    tree: ShopCategoryNode[],
    baseUrl: string,
  ): Promise<ShopCategoryNode[] | null> {
    const key = this.config.get<string>("openaiApiKey");
    const model = this.config.get<string>("openaiModel", "gpt-4o-mini");
    if (!key) return null;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You clean ecommerce navigation category trees. Reply with JSON only: " +
                '{"categories":[{"name":"string","children":[]}]} . ' +
                "Keep only real product categories from the site menu. " +
                "Remove account/cart/contact/legal items. Preserve hierarchy. " +
                `Max depth ${SHOP_CATEGORY_MAX_DEPTH}, max ${SHOP_CATEGORY_MAX_NODES} nodes. French labels preferred. No markdown.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                url: baseUrl,
                tree: stripIds(tree),
              }),
            },
          ],
        }),
      });

      if (!res.ok) return null;

      const data = (await res.json().catch(() => ({}))) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data?.choices?.[0]?.message?.content;
      if (!text) return null;

      const parsed = JSON.parse(text) as { categories?: unknown };
      if (!Array.isArray(parsed.categories)) return null;
      return truncateTree(dedupeSiblings(assignIds(parsed.categories)));
    } catch (err) {
      this.logger.warn(
        "Nettoyage IA de l’arbre catégories échoué, conservation du parse HTML",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }
}

function normalizeLabel(raw: string): string {
  return raw
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/\(\s*\d+\s*\)\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SHOP_CATEGORY_NAME_MAX_LENGTH);
}

function rawToNode(item: RawNavItem): ShopCategoryNode {
  return {
    id: randomUUID(),
    name: item.name,
    children: item.children.map(rawToNode),
  };
}

function stripIds(
  nodes: ShopCategoryNode[],
): { name: string; children: ReturnType<typeof stripIds> }[] {
  return nodes.map((n) => ({ name: n.name, children: stripIds(n.children) }));
}

function assignIds(raw: unknown[]): ShopCategoryNode[] {
  const out: ShopCategoryNode[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    const name = typeof o["name"] === "string" ? normalizeLabel(o["name"]) : "";
    if (!name) continue;
    const childrenRaw = Array.isArray(o["children"]) ? o["children"] : [];
    out.push({
      id: randomUUID(),
      name,
      children: assignIds(childrenRaw),
    });
  }
  return out;
}

function dedupeSiblings(nodes: ShopCategoryNode[]): ShopCategoryNode[] {
  const byName = new Map<string, ShopCategoryNode>();
  for (const node of nodes) {
    const key = node.name.toLocaleLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.children = dedupeSiblings([...existing.children, ...node.children]);
    } else {
      byName.set(key, {
        ...node,
        children: dedupeSiblings(node.children),
      });
    }
  }
  return [...byName.values()];
}

function countNodes(nodes: ShopCategoryNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

function truncateTree(
  nodes: ShopCategoryNode[],
  depth = 1,
  budget = { remaining: SHOP_CATEGORY_MAX_NODES },
): ShopCategoryNode[] {
  if (depth > SHOP_CATEGORY_MAX_DEPTH || budget.remaining <= 0) return [];
  const result: ShopCategoryNode[] = [];
  for (const node of nodes) {
    if (budget.remaining <= 0) break;
    budget.remaining -= 1;
    result.push({
      id: node.id,
      name: node.name,
      children: truncateTree(node.children, depth + 1, budget),
    });
  }
  return result;
}
