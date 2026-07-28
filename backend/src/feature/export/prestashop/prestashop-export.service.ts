import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Readable } from "node:stream";

import { CatalogService } from "../../../domain/catalog/catalog.service";
import { ShopService } from "../../../domain/shop/shop.service";
import type { AuthenticatedUser } from "../../../core/auth/types/jwt-payload.types";
import { PRESTASHOP_COMBINATION_HEADERS, PRESTASHOP_PRODUCT_HEADERS } from "./prestashop-headers";
import { PrestashopCombinationMapper } from "./prestashop-combination.mapper";
import { PrestashopCsvService } from "./prestashop-csv.service";
import { PrestashopProductMapper } from "./prestashop-product.mapper";
import {
  DuplicateProductReferenceError,
  MissingProductReferenceError,
  validateProductReferences,
} from "./prestashop-reference";
import type { PrestashopExportType } from "./prestashop.types";

export type PrestashopExportRequest = {
  type: PrestashopExportType;
  shopId: string;
  productIds: string[];
};

export type PrestashopExportStreamResult = {
  stream: Readable;
  filename: string;
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
   * Charge les produits sélectionnés, valide les références, mappe et stream le CSV.
   *
   * @throws NotFoundException Boutique inaccessible ou aucun produit
   * @throws BadRequestException Référence manquante ou dupliquée
   */
  async export(
    req: PrestashopExportRequest,
    user: AuthenticatedUser,
  ): Promise<PrestashopExportStreamResult> {
    await this.shopService.getForUser(req.shopId, user);

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

    if (req.type === "products") {
      const rows = this.productMapper.map(products, references);
      return {
        stream: this.csvService.toStream(rows, PRESTASHOP_PRODUCT_HEADERS),
        filename: "products.csv",
      };
    }

    const rows = this.combinationMapper.map(products, references);
    return {
      stream: this.csvService.toStream(rows, PRESTASHOP_COMBINATION_HEADERS),
      filename: "combinations.csv",
    };
  }
}
