import type { CatalogProduct } from "../../../domain/catalog/types/catalog.types";
import type { ShopCategoryNode } from "../../../domain/shop/types/shop-category.types";

export type FlattenedCategoryNode = {
  node: ShopCategoryNode;
  pathNames: string[];
  depth: number;
};

export type CategoryMatchKind = "exact" | "token" | "none";

export type CategoryResolveResult = {
  path: string;
  matchedNodeId: string | null;
  matchKind: CategoryMatchKind;
};

/** Mots vides FR ignorés pour le matching par tokens. */
const STOP_WORDS = new Set([
  "de",
  "des",
  "du",
  "d",
  "la",
  "le",
  "les",
  "l",
  "un",
  "une",
  "et",
  "a",
  "au",
  "aux",
  "en",
  "pour",
]);

/**
 * Aplatit l’arbre en liste de nœuds avec leur chemin de noms (racine → nœud).
 */
export function flattenCategoryTree(
  tree: ShopCategoryNode[],
  parentPath: string[] = [],
): FlattenedCategoryNode[] {
  const result: FlattenedCategoryNode[] = [];
  for (const node of tree) {
    const pathNames = [...parentPath, node.name];
    result.push({ node, pathNames, depth: pathNames.length });
    result.push(...flattenCategoryTree(node.children, pathNames));
  }
  return result;
}

/**
 * Construit la cellule catégories PrestaShop pour l’import produits.
 * Format attendu : `Parent,Enfant,Feuille` (virgules — pas `>`).
 */
export function buildCategoryBreadcrumb(pathNames: string[]): string {
  return pathNames.join(",");
}

/**
 * Normalise un libellé pour comparaison (casse, accents, espaces).
 */
export function normalizeCategoryLabel(value: string): string {
  return value.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/\s+/g, " ");
}

/** Clé normalisée `category|subCategory` pour overrides manuels. */
export function buildCategoryMappingKey(category: string, subCategory: string | null): string {
  const cat = normalizeCategoryLabel(category);
  const sub =
    subCategory !== null && subCategory.trim().length > 0
      ? normalizeCategoryLabel(subCategory)
      : "";
  return `${cat}|${sub}`;
}

/**
 * Catégories fabricant plates (comportement historique) : `Catégorie,SousCatégorie`.
 */
export function buildManufacturerCategoriesCell(product: CatalogProduct): string {
  const parts = [product.category.trim()];
  if (product.subCategory !== null && product.subCategory.trim().length > 0) {
    parts.push(product.subCategory.trim());
  }
  return parts.filter((p) => p.length > 0).join(",");
}

function tokenizeCategoryLabel(normalized: string): Set<string> {
  const tokens = normalized
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

type MatchKind = "exact" | "token";

/**
 * Comparaison stricte : égalité exacte, sinon tokens (après stop-words).
 * Pas de `includes` naïf — évite les faux positifs (« Surf » ↔ « Surface », etc.).
 */
function scoreMatch(needle: string, haystack: string): MatchKind | null {
  if (needle.length === 0 || haystack.length === 0) return null;
  if (needle === haystack) return "exact";

  const needleTokens = tokenizeCategoryLabel(needle);
  const haystackTokens = tokenizeCategoryLabel(haystack);
  if (needleTokens.size === 0 || haystackTokens.size === 0) return null;

  if (setsEqual(needleTokens, haystackTokens)) return "token";

  // Sous-ensemble uniquement si le plus petit a ≥ 2 tokens
  // (ex. « ailes kitesurf » ⊂ « ailes de kitesurf freestyle » après stop-words).
  const [smaller, larger] =
    needleTokens.size <= haystackTokens.size
      ? [needleTokens, haystackTokens]
      : [haystackTokens, needleTokens];
  if (smaller.size >= 2 && isSubset(smaller, larger)) return "token";

  return null;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

function isSubset(smaller: Set<string>, larger: Set<string>): boolean {
  for (const v of smaller) {
    if (!larger.has(v)) return false;
  }
  return true;
}

export function findFlattenedNodeById(
  tree: ShopCategoryNode[],
  nodeId: string,
): FlattenedCategoryNode | null {
  return flattenCategoryTree(tree).find((e) => e.node.id === nodeId) ?? null;
}

/**
 * Cherche le meilleur nœud de l’arbre pour une paire catégorie / sous-catégorie fabricant.
 * Priorité : exact sur subCategory → token sur subCategory → exact/token sur category.
 * En cas d’égalité, préfère le chemin le plus profond / aligné sur la catégorie.
 */
export function autoMatchCategoryNode(
  category: string,
  subCategory: string | null,
  tree: ShopCategoryNode[],
): FlattenedCategoryNode | null {
  const flat = flattenCategoryTree(tree);
  if (flat.length === 0) return null;

  const subNorm =
    subCategory !== null && subCategory.trim().length > 0
      ? normalizeCategoryLabel(subCategory)
      : "";
  const catNorm = normalizeCategoryLabel(category);

  let best: FlattenedCategoryNode | null = null;
  let bestRank = -1;

  for (const entry of flat) {
    const nameNorm = normalizeCategoryLabel(entry.node.name);

    let kind: MatchKind | null = null;
    let sourcePriority = 0;

    if (subNorm.length > 0) {
      kind = scoreMatch(subNorm, nameNorm);
      if (kind !== null) sourcePriority = 2;
    }
    if (kind === null && catNorm.length > 0) {
      kind = scoreMatch(catNorm, nameNorm);
      if (kind !== null) sourcePriority = 1;
    }
    if (kind === null) continue;

    const kindScore = kind === "exact" ? 2 : 1;
    const pathBonus =
      catNorm.length > 0 &&
      entry.pathNames.some((part) => scoreMatch(catNorm, normalizeCategoryLabel(part)) === "exact")
        ? 5
        : 0;
    const rank = sourcePriority * 100 + kindScore * 10 + pathBonus + entry.depth;
    if (rank > bestRank) {
      bestRank = rank;
      best = entry;
    }
  }

  return best;
}

export type CategoryOverrideMap = ReadonlyMap<string, string>;

/**
 * Résout la cellule « Catégories » PrestaShop :
 * override manuel → auto-match → catégories fabricant (pas de repli racine forcé).
 */
export function resolveExportCategoryPath(
  product: CatalogProduct,
  categoryTree: ShopCategoryNode[],
  overrides: CategoryOverrideMap = new Map(),
): string {
  return resolveExportCategory(product, categoryTree, overrides).path;
}

/**
 * Résolution détaillée (preview + export).
 */
export function resolveExportCategory(
  product: CatalogProduct,
  categoryTree: ShopCategoryNode[],
  overrides: CategoryOverrideMap = new Map(),
): CategoryResolveResult {
  if (categoryTree.length === 0) {
    return {
      path: buildManufacturerCategoriesCell(product),
      matchedNodeId: null,
      matchKind: "none",
    };
  }

  const sourceKey = buildCategoryMappingKey(product.category, product.subCategory);
  const overrideNodeId = overrides.get(sourceKey);
  if (overrideNodeId !== undefined) {
    if (overrideNodeId === "") {
      return {
        path: buildManufacturerCategoriesCell(product),
        matchedNodeId: null,
        matchKind: "none",
      };
    }
    const overridden = findFlattenedNodeById(categoryTree, overrideNodeId);
    if (overridden !== null) {
      return {
        path: buildCategoryBreadcrumb(overridden.pathNames),
        matchedNodeId: overridden.node.id,
        matchKind: "exact",
      };
    }
  }

  const matched = autoMatchCategoryNode(product.category, product.subCategory, categoryTree);
  if (matched !== null) {
    const nameNorm = normalizeCategoryLabel(matched.node.name);
    const subNorm =
      product.subCategory !== null && product.subCategory.trim().length > 0
        ? normalizeCategoryLabel(product.subCategory)
        : "";
    const catNorm = normalizeCategoryLabel(product.category);
    const against = subNorm.length > 0 ? subNorm : catNorm;
    const kind = scoreMatch(against, nameNorm);
    return {
      path: buildCategoryBreadcrumb(matched.pathNames),
      matchedNodeId: matched.node.id,
      matchKind: kind === "exact" ? "exact" : "token",
    };
  }

  return {
    path: buildManufacturerCategoriesCell(product),
    matchedNodeId: null,
    matchKind: "none",
  };
}
