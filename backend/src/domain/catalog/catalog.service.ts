import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ShopService } from "../shop/shop.service";
import { CATALOG_SEARCH_MAX_LIMIT } from "./catalog.constants";
import {
  CATALOG_REPOSITORY,
  type CatalogSearchCriteria,
  type ICatalogRepository,
} from "./catalog.repository.interface";
import type { CatalogProduct } from "./types/catalog.types";
/** Plafond de suggestions de marques par secteur. */
const BRANDS_BY_SECTOR_LIMIT = 50;

/**
 * Couche applicative catalogue : lecture des produits fabricants via Supabase (RLS).
 */
@Injectable()
export class CatalogService {
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
   * When the shop has no brands, returns the global catalog (same as search without criteria).
   *
   * @throws NotFoundException When the shop does not exist or is not owned by `user`.
   */
  async listCatalogProductsByShopBrands(
    shopId: string,
    user: AuthenticatedUser,
  ): Promise<CatalogProduct[]> {
    const shop = await this.shopService.getForUser(shopId, user);
    if (shop.brands.length === 0) {
      return this.search({ limit: CATALOG_SEARCH_MAX_LIMIT });
    }

    return this.search({
      brands: shop.brands,
      limit: CATALOG_SEARCH_MAX_LIMIT,
    });
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
      return this.search({ limit: CATALOG_SEARCH_MAX_LIMIT });
    }

    return this.search({
      brands: shop.brands,
      limit: CATALOG_SEARCH_MAX_LIMIT,
    });
  }

  /**
   * Marques catalogue distinctes pour un secteur (suggestions magasin).
   */
  async listBrandsBySector(sector: string): Promise<string[]> {
    const trimmed = sector.trim();
    if (!trimmed) return [];
    return this.catalogRepo.listDistinctBrandsBySector(trimmed, BRANDS_BY_SECTOR_LIMIT);
  }
}
