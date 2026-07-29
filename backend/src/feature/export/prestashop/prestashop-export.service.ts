import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Readable } from "node:stream";

import { CatalogService } from "../../../domain/catalog/catalog.service";
import { ShopService } from "../../../domain/shop/shop.service";
import type { AuthenticatedUser } from "../../../core/auth/types/jwt-payload.types";
import type { ExportCategoryPreviewResponse } from "../dto/export-category-preview.dto";
import {
  buildCategoryMappingKey,
  buildManufacturerCategoriesCell,
  flattenCategoryTree,
  resolveExportCategory,
  type CategoryOverrideMap,
} from "./category-tree-matcher";
import { PRESTASHOP_COMBINATION_HEADERS, PRESTASHOP_PRODUCT_HEADERS } from "./prestashop-headers";
import { PrestashopCombinationMapper } from "./prestashop-combination.mapper";
import { PrestashopCsvService } from "./prestashop-csv.service";
import { PrestashopProductMapper } from "./prestashop-product.mapper";
import {
  DuplicateProductReferenceError,
  MissingProductReferenceError,
  assignPrestashopImportIds,
  validateProductReferences,
} from "./prestashop-reference";
import type { PrestashopExportType } from "./prestashop.types";

export type CategoryOverrideInput = {
  sourceKey: string;
  targetNodeId: string;
};

export type PrestashopExportRequest = {
  type: PrestashopExportType;
  shopId: string;
  productIds: string[];
  categoryOverrides?: CategoryOverrideInput[];
};

export type PrestashopExportStreamResult = {
  stream: Readable;
  filename: string;
};

export type PrestashopCategoryPreviewRequest = {
  shopId: string;
  productIds: string[];
};

/**
 * Orchestre l’export CSV PrestaShop 8 (sans débit de crédits).
 */
@Injectable()
export class PrestashopExportService {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly shopService: ShopService,
    private readonly productMapper: PrestashopProductMapper,
    private readonly combinationMapper: PrestashopCombinationMapper,
    private readonly csvService: PrestashopCsvService,
  ) {}

  /**
   * Prévisualise le matching catégories fabricant → arbre magasin (paires uniques).
   */
  async previewCategories(
    req: PrestashopCategoryPreviewRequest,
    user: AuthenticatedUser,
  ): Promise<ExportCategoryPreviewResponse> {
    const shop = await this.shopService.getForUser(req.shopId, user);
    const products = await this.catalogService.findByIds(req.productIds);
    if (products.length === 0) {
      throw new NotFoundException("Aucun produit trouvé");
    }

    const treeOptions = flattenCategoryTree(shop.categoryTree).map((entry) => ({
      id: entry.node.id,
      path: entry.pathNames.join(">"),
      depth: entry.depth,
    }));

    type Acc = {
      category: string;
      subCategory: string | null;
      manufacturerPath: string;
      suggestedPath: string;
      suggestedNodeId: string | null;
      matchKind: "exact" | "token" | "none";
      productCount: number;
    };

    const byKey = new Map<string, Acc>();

    for (const product of products) {
      const sourceKey = buildCategoryMappingKey(product.category, product.subCategory);
      const existing = byKey.get(sourceKey);
      if (existing !== undefined) {
        existing.productCount += 1;
        continue;
      }

      const resolved = resolveExportCategory(product, shop.categoryTree);
      byKey.set(sourceKey, {
        category: product.category,
        subCategory: product.subCategory,
        manufacturerPath: buildManufacturerCategoriesCell(product),
        suggestedPath: resolved.path,
        suggestedNodeId: resolved.matchedNodeId,
        matchKind: resolved.matchKind,
        productCount: 1,
      });
    }

    const pairs = [...byKey.entries()]
      .map(([sourceKey, value]) => ({ sourceKey, ...value }))
      .sort((a, b) => a.sourceKey.localeCompare(b.sourceKey, "fr"));

    return { pairs, treeOptions };
  }

  /**
   * Charge les produits sélectionnés, valide les références, mappe et stream le CSV.
   *
   * @throws NotFoundException Boutique inaccessible ou aucun produit
   * @throws BadRequestException Référence manquante ou dupliquée
   */
  async export(
    req: PrestashopExportRequest,
    user: AuthenticatedUser,
  ): Promise<PrestashopExportStreamResult> {
    const shop = await this.shopService.getForUser(req.shopId, user);
    const products = await this.catalogService.findByIds(req.productIds);

    if (products.length === 0) {
      throw new NotFoundException("Aucun produit trouvé");
    }

    let references: Map<string, string>;
    try {
      references = validateProductReferences(products);
    } catch (err) {
      if (
        err instanceof MissingProductReferenceError ||
        err instanceof DuplicateProductReferenceError
      ) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }

    const importIds = assignPrestashopImportIds(products);

    if (req.type === "products") {
      const overrides = toOverrideMap(req.categoryOverrides ?? []);
      const rows = this.productMapper.map(
        products,
        references,
        importIds,
        shop.categoryTree,
        overrides,
      );
      return {
        stream: this.csvService.toStream(rows, PRESTASHOP_PRODUCT_HEADERS),
        filename: "products.csv",
      };
    }

    const rows = this.combinationMapper.map(products, references, importIds);
    return {
      stream: this.csvService.toStream(rows, PRESTASHOP_COMBINATION_HEADERS),
      filename: "combinations.csv",
    };
  }
}

function toOverrideMap(overrides: CategoryOverrideInput[]): CategoryOverrideMap {
  const map = new Map<string, string>();
  for (const item of overrides) {
    map.set(item.sourceKey, item.targetNodeId);
  }
  return map;
}
