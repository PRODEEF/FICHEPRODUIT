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
import { fetchHtmlSafeForServer } from "./scrape-url-policy";
import type { CmsType } from "./scraper.types";

/** Au-delà de ce seuil, un nettoyage IA optionnel est tenté. */
const AI_CLEANUP_NODE_THRESHOLD = 40;

/** Arbre entièrement plat : cleanup IA si au moins ce nombre de nœuds. */
const AI_FLAT_TREE_MIN_NODES = 8;

const MEGAMENU_FETCH_TIMEOUT_MS = 15_000;
const MEGAMENU_USER_AGENT =
  "Mozilla/5.0 (compatible; FicheProduitBot/1.0; +https://ficheproduct.local)";

const NESTED_MENU_SELECTORS = [
  "> .popover",
  "> .submenu",
  "> .sub-menu",
  "> .js-sub-menu",
  "> .dropdown-menu",
  "> .mega-menu",
  "> .menu",
  "> .popover-content",
  "> .tv-sub-menu",
  "> .menu-dropdown",
].join(", ");

const SUBMENU_EXCLUDE_SELECTOR =
  ".popover, .submenu, .sub-menu, .js-sub-menu, .dropdown-menu, .mega-menu, .menu, .tv-sub-menu, .menu-dropdown, ul";
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

/** Sélecteurs ThemeVolty / tvcmsmegamenu (PrestaShop thèmes custom). */
const THEMEVOLTY_MENU_SELECTORS = [
  "#tvdesktop-megamenu",
  "#tv-menu-horizontal",
  "ul.menu-content",
  ".tv-menu-horizontal",
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
    ...THEMEVOLTY_MENU_SELECTORS,
  ],
  shopify: ["#SiteNav", ".site-nav", "nav.header__inline-menu", ".list-menu"],
  woocommerce: [".main-navigation", "#site-navigation", "nav.woocommerce", ".primary-menu"],
  unknown: [],
};

const FALLBACK_SELECTORS = [
  ...THEMEVOLTY_MENU_SELECTORS,
  "header nav",
  "nav",
  "#navigation",
  ".navbar",
  ".menu",
  "header",
];
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

    // ThemeVolty / tvcmsmegamenu : sous-menus absents de la homepage, chargés via endpoint dédié
    if (tree.length === 0 || isEntirelyFlat(tree)) {
      const megaHtml = await this.tryFetchMegamenuHtml(input.html, input.baseUrl);
      if (megaHtml) {
        try {
          const enriched = this.extractFromHtml({ ...input, html: megaHtml });
          if (
            enriched.length > 0 &&
            (countNodes(enriched) > countNodes(tree) || !isEntirelyFlat(enriched))
          ) {
            tree = enriched;
          }
        } catch (err) {
          this.logger.warn(
            `Extraction megamenu échouée pour ${input.baseUrl}`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }

    if (tree.length === 0) return [];

    const nodeCount = countNodes(tree);
    const shouldAiCleanup =
      nodeCount > AI_CLEANUP_NODE_THRESHOLD ||
      (isEntirelyFlat(tree) && nodeCount >= AI_FLAT_TREE_MIN_NODES);

    if (shouldAiCleanup) {
      const cleaned = await this.tryAiCleanup(tree, input.baseUrl);
      if (cleaned) tree = cleaned;
    }

    return truncateTree(dedupeSiblings(tree));
  }

  /**
   * Récupère le HTML du mega-menu ThemeVolty si la homepage n’embarque que les racines.
   */
  private async tryFetchMegamenuHtml(html: string, baseUrl: string): Promise<string | null> {
    const megaUrl = detectMegamenuUrl(html, baseUrl);
    if (!megaUrl) return null;

    try {
      const fetched = await fetchHtmlSafeForServer(megaUrl, {
        timeoutMs: MEGAMENU_FETCH_TIMEOUT_MS,
        userAgent: MEGAMENU_USER_AGENT,
      });
      if (!fetched.ok) {
        this.logger.warn(`Fetch megamenu échoué (${megaUrl}): ${fetched.error}`);
        return null;
      }
      return fetched.html;
    } catch (err) {
      this.logger.warn(
        `Fetch megamenu échoué (${megaUrl})`,
        err instanceof Error ? err.message : err,
      );
      return null;
    }
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
        const hierarchical = items.every((i) => i.children.length === 0)
          ? buildTreeFromUrlPaths(items, baseHost)
          : items;
        return hierarchical.map(rawToNode);
      }

      // Menu présent mais structure atypique : liens plats, puis hiérarchie via URLs
      const flat = this.parseFlatLinks($, root, baseHost);
      if (flat.length > 0) {
        return buildTreeFromUrlPaths(flat, baseHost).map(rawToNode);
      }
    }

    return [];
  }

  private parseListItems(
    $: CheerioAPI,
    container: Cheerio<AnyNode>,
    baseHost: string,
    depth: number,
    excludeHref?: string,
  ): RawNavItem[] {
    if (depth > SHOP_CATEGORY_MAX_DEPTH) return [];

    const source = this.resolveListItems($, container);

    const items: RawNavItem[] = [];
    source.each((_, el) => {
      const li = $(el);
      const link = this.findPrimaryLink($, li);
      if (link.length === 0) return;

      const name = linkLabel($, link);
      const href = (link.attr("href") ?? "").trim();
      if (!name || !this.isLikelyCategory(name, href, baseHost)) return;
      if (excludeHref && sameHref(href, excludeHref, baseHost)) return;

      const nestedUl = li.children("ul");
      const children =
        nestedUl.length > 0
          ? this.parseListItems($, li, baseHost, depth + 1, href)
          : this.parseNestedMenus($, li, baseHost, depth + 1, href);

      items.push({ name, href, children });
    });

    return items;
  }

  /**
   * Résout les `li` d’un conteneur : `ul` / `li` directs, sinon tous les `ul`
   * « racines » descendants (mega-menus multi-colonnes : `.popover > div > ul`).
   */
  private resolveListItems($: CheerioAPI, container: Cheerio<AnyNode>): Cheerio<AnyNode> {
    const directUl = container.children("ul");
    if (directUl.length > 0) {
      return directUl.children("li");
    }

    const directLi = container.children("li");
    if (directLi.length > 0) return directLi;

    // Mega-menu : ul imbriqués sous des div — uniquement les ul sans ancêtre ul
    // dans ce conteneur (évite de mélanger sous-niveaux et colonnes sœurs).
    const containerEl = container.get(0);
    const rootUls = container.find("ul").filter((_, ul) => {
      if (!containerEl) return false;
      let parent = ul.parent;
      while (parent && parent !== containerEl) {
        if (parent.type === "tag" && parent.name === "ul") return false;
        parent = parent.parent;
      }
      return true;
    });
    if (rootUls.length > 0) {
      return rootUls.children("li");
    }

    return $();
  }

  /** Premier lien représentatif du item (PrestaShop wrappe parfois le `<a>`). */
  private findPrimaryLink($: CheerioAPI, li: Cheerio<AnyNode>): Cheerio<AnyNode> {
    const direct = li.children("a").first();
    if (direct.length > 0) return direct;

    // Lien hors popover/sous-menu (évite de prendre un enfant comme label parent)
    const outsideSubmenu = li.children().not(SUBMENU_EXCLUDE_SELECTOR).find("a").first();
    if (outsideSubmenu.length > 0) return outsideSubmenu;

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
      const name = linkLabel($, link);
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
    parentHref: string,
  ): RawNavItem[] {
    if (depth > SHOP_CATEGORY_MAX_DEPTH) return [];

    const nested = li.find(NESTED_MENU_SELECTORS).first();
    if (nested.length === 0) return [];
    return this.parseListItems($, nested, baseHost, depth, parentHref);
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

/** Label du lien sans badges ThemeVolty (`.menu-subtitle`). */
function linkLabel($: CheerioAPI, link: Cheerio<AnyNode>): string {
  const clone = link.clone();
  clone.find(".menu-subtitle").remove();
  return normalizeLabel(clone.text());
}

/**
 * Détecte l’URL du mega-menu ThemeVolty (`gettvcmsmegamenulink`) dans le HTML homepage.
 */
function detectMegamenuUrl(html: string, baseUrl: string): string | null {
  const patterns = [
    /gettvcmsmegamenulink\s*=\s*["']([^"']+)["']/i,
    /["']((?:https?:)?\/\/[^"']*\/module\/tvcmsmegamenu\/[^"']*)["']/i,
    /["'](\/module\/tvcmsmegamenu\/[^"']+)["']/i,
  ];

  let raw: string | null = null;
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      raw = match[1].replace(/\\\//g, "/");
      break;
    }
  }
  if (!raw) return null;

  try {
    const absolute = new URL(raw, baseUrl);
    const baseHost = new URL(baseUrl).hostname.replace(/^www\./i, "").toLowerCase();
    const megaHost = absolute.hostname.replace(/^www\./i, "").toLowerCase();
    if (megaHost !== baseHost) return null;
    if (!/\/module\/tvcmsmegamenu\//i.test(absolute.pathname)) return null;
    return absolute.href;
  } catch {
    return null;
  }
}

function normalizePath(href: string, baseHost: string): string {
  try {
    const absolute = new URL(href, `https://${baseHost}`);
    let path = absolute.pathname.toLowerCase().replace(/\/+$/, "");
    if (path === "") path = "/";
    return path;
  } catch {
    return href.toLowerCase();
  }
}

function sameHref(a: string, b: string, baseHost: string): boolean {
  return normalizePath(a, baseHost) === normalizePath(b, baseHost);
}

/**
 * Reconstruit une hiérarchie parent/enfant à partir de préfixes de chemins URL
 * quand le parse HTML n’a produit que des liens plats.
 */
function buildTreeFromUrlPaths(items: RawNavItem[], baseHost: string): RawNavItem[] {
  if (items.length === 0) return [];

  const withPaths = items.map((item) => ({
    item,
    path: normalizePath(item.href, baseHost),
  }));

  // Plus court d’abord pour attacher les enfants ensuite
  withPaths.sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));

  type Mutable = RawNavItem & { path: string };
  const nodes: Mutable[] = withPaths.map(({ item, path }) => ({
    name: item.name,
    href: item.href,
    children: [],
    path,
  }));

  const roots: Mutable[] = [];

  for (const node of nodes) {
    if (node.path === "/" || node.path === "") {
      roots.push(node);
      continue;
    }

    let bestParent: Mutable | null = null;
    for (const candidate of nodes) {
      if (candidate === node) continue;
      if (!isPathPrefix(candidate.path, node.path)) continue;
      if (
        !bestParent ||
        candidate.path.length > bestParent.path.length ||
        (candidate.path.length === bestParent.path.length &&
          candidate.path.localeCompare(bestParent.path) > 0)
      ) {
        bestParent = candidate;
      }
    }

    if (bestParent) {
      bestParent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.map(stripPath);
}

function isPathPrefix(parentPath: string, childPath: string): boolean {
  if (parentPath === "/" || parentPath === childPath) return false;
  return childPath.startsWith(parentPath.endsWith("/") ? parentPath : `${parentPath}/`);
}

function stripPath(node: RawNavItem & { path?: string }): RawNavItem {
  return {
    name: node.name,
    href: node.href,
    children: node.children.map((c) => stripPath(c as RawNavItem & { path?: string })),
  };
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

function isEntirelyFlat(nodes: ShopCategoryNode[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.children.length === 0);
}

/**
 * Troncature en largeur avec round-robin : conserve toutes les racines possibles,
 * puis répartit le budget restant équitablement entre les frères à chaque niveau.
 */
function truncateTree(nodes: ShopCategoryNode[]): ShopCategoryNode[] {
  const budget = { remaining: SHOP_CATEGORY_MAX_NODES };

  type Frame = {
    sourceChildren: ShopCategoryNode[];
    targetChildren: ShopCategoryNode[];
    nextIndex: number;
    depth: number;
  };

  const roots: ShopCategoryNode[] = [];
  let level: Frame[] = [];

  for (const node of nodes) {
    if (budget.remaining <= 0 || 1 > SHOP_CATEGORY_MAX_DEPTH) break;
    budget.remaining -= 1;
    const copy: ShopCategoryNode = { id: node.id, name: node.name, children: [] };
    roots.push(copy);
    if (node.children.length > 0 && 1 < SHOP_CATEGORY_MAX_DEPTH) {
      level.push({
        sourceChildren: node.children,
        targetChildren: copy.children,
        nextIndex: 0,
        depth: 1,
      });
    }
  }

  while (level.length > 0 && budget.remaining > 0) {
    const nextLevel: Frame[] = [];
    let progress = true;

    while (progress && budget.remaining > 0) {
      progress = false;
      for (const frame of level) {
        if (budget.remaining <= 0) break;
        if (frame.nextIndex >= frame.sourceChildren.length) continue;

        const child = frame.sourceChildren[frame.nextIndex];
        frame.nextIndex += 1;
        if (!child) continue;

        budget.remaining -= 1;
        progress = true;

        const copy: ShopCategoryNode = { id: child.id, name: child.name, children: [] };
        frame.targetChildren.push(copy);

        if (child.children.length > 0 && frame.depth + 1 < SHOP_CATEGORY_MAX_DEPTH) {
          nextLevel.push({
            sourceChildren: child.children,
            targetChildren: copy.children,
            nextIndex: 0,
            depth: frame.depth + 1,
          });
        }
      }
    }

    level = nextLevel;
  }

  return roots;
}
