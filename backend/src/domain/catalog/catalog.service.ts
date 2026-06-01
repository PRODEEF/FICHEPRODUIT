import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ShopService } from "../shop/shop.service";
import {
  CATALOG_REPOSITORY,
  type CatalogSearchCriteria,
  type ICatalogRepository,
} from "./catalog.repository.interface";
import type { CatalogProduct } from "./types/catalog.types";

/** Upper bound aligned with {@link CatalogRepository} MAX_LIMIT for shop-brand listings. */
const SHOP_BRANDS_CATALOG_LIMIT = 1000;

/**
 * Couche applicative catalogue : lecture des produits fabricants via Supabase (RLS).
 */
@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    @Inject(CATALOG_REPOSITORY)
    private readonly catalogRepo: ICatalogRepository,
    private readonly shopService: ShopService,
  ) {}

  /**
   * Charge plusieurs produits par identifiants, dans l’ordre des `ids` (entrées introuvable omises).
   *
   * @param ids Identifiants UUID des produits catalogue
   */
  async findByIds(ids: string[]): Promise<CatalogProduct[]> {
    return this.catalogRepo.findByIds(ids);
  }

  /**
   * Détail d’un produit catalogue.
   *
   * @throws NotFoundException Si aucune ligne ne correspond à `id`
   */
  async getById(id: string): Promise<CatalogProduct> {
    const product = await this.catalogRepo.findById(id);
    if (!product) {
      throw new NotFoundException("Produit catalogue introuvable");
    }
    return product;
  }

  async search(criteria: CatalogSearchCriteria): Promise<CatalogProduct[]> {
    return this.catalogRepo.search(criteria);
  }

  /**
   * Lists catalog products whose `brand` is in the given shop's `brands` array.
   * Does not filter by sector or category — only by shop brands.
   *
   * @returns Empty array when the shop has no brands configured.
   * @throws NotFoundException When the shop does not exist or is not owned by `user`.
   */
  async listCatalogProductsByShopBrands(
    shopId: string,
    user: AuthenticatedUser,
  ): Promise<CatalogProduct[]> {
    const shop = await this.shopService.getForUser(shopId, user);
    if (shop.brands.length === 0) {
      this.logger.log(
        `[by-shop-brands] shopId=${shopId} brands=[] → returning [] (no catalog search)`,
      );
      return [];
    }

    const criteria: CatalogSearchCriteria = {
      brands: shop.brands,
      limit: SHOP_BRANDS_CATALOG_LIMIT,
    };
    this.logger.log(`[by-shop-brands] calling catalogRepo.search with ${JSON.stringify(criteria)}`);

    const products = await this.search(criteria);

    this.logger.log(
      `[by-shop-brands] shopId=${shopId} brands=${JSON.stringify(shop.brands)} count=${products.length}`,
    );
    this.logger.log(`[by-shop-brands] response body:\n${JSON.stringify(products, null, 2)}`);

    return products;
  }

  /**
   * Même logique que {@link listCatalogProductsByShopBrands} pour une boutique invitée
   * (session cookie alignée sur `shop.session_id`).
   */
  async listCatalogProductsByShopBrandsForGuest(
    shopId: string,
    sessionId: string,
  ): Promise<CatalogProduct[]> {
    const shop = await this.shopService.getForGuest(shopId, sessionId);
    if (shop.brands.length === 0) {
      this.logger.log(
        `[by-shop-brands] guest shopId=${shopId} brands=[] → returning [] (no catalog search)`,
      );
      return [];
    }

    const criteria: CatalogSearchCriteria = {
      brands: shop.brands,
      limit: SHOP_BRANDS_CATALOG_LIMIT,
    };
    this.logger.log(
      `[by-shop-brands] guest calling catalogRepo.search with ${JSON.stringify(criteria)}`,
    );

    const products = await this.search(criteria);

    this.logger.log(
      `[by-shop-brands] guest shopId=${shopId} brands=${JSON.stringify(shop.brands)} count=${products.length}`,
    );

    return products;
  }
}
