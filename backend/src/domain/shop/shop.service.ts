import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CmsType } from "../../core/scraper/scraper.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { SHOP_REPOSITORY, type IShopRepository } from "./shop.repository.interface";
import type { Shop, ShopCms } from "./types/shop.types";

function shopDisplayNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "");
    return host.length > 0 ? host : url;
  } catch {
    return url;
  }
}

function mapScraperCmsToShopCms(cms: CmsType): ShopCms {
  switch (cms) {
    case "prestashop":
    case "shopify":
    case "woocommerce":
      return cms;
    case "unknown":
    default:
      return "inconnu";
  }
}

@Injectable()
export class ShopService {
  constructor(
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepo: IShopRepository,
  ) {}

  /**
   * Création ou mise à jour depuis le pipeline d’analyse.
   * - connecté : ownership via ownerId
   * - invité : ownership via sessionId
   */
  async createOrUpdateFromAnalysis(
    input: {
      url: string;
      cms: CmsType;
      sector: string | null;
      brands: string[];
      categories: string[];
      ownerId: string | null;
      sessionId: string | null;
    },
    accessToken: string,
  ): Promise<Shop> {
    const name = shopDisplayNameFromUrl(input.url);
    const cms = mapScraperCmsToShopCms(input.cms);

    return this.shopRepo.upsertFromAnalysis(
      {
        name,
        url: input.url,
        cms,
        sector: input.sector,
        brands: input.brands,
        categories: input.categories,
        ownerId: input.ownerId,
        sessionId: input.sessionId,
      },
      accessToken,
    );
  }

  async getMyShop(ownerId: string, accessToken: string): Promise<Shop | null> {
    const shops = await this.shopRepo.findAllByOwner(ownerId, accessToken);
    return shops[0] ?? null;
  }

  async updateMyShop(
    ownerId: string,
    dto: Partial<{
      name: string;
      url: string;
      cms: ShopCms;
      sector: string | null;
      brands: string[];
      categories: string[];
    }>,
    accessToken: string,
  ): Promise<Shop> {
    const shops = await this.shopRepo.findAllByOwner(ownerId, accessToken);
    const shop = shops[0];
    if (!shop) {
      throw new NotFoundException("Shop not found");
    }
    return this.shopRepo.update(shop.id, dto, accessToken);
  }

  async getForUser(id: string, user: AuthenticatedUser): Promise<Shop> {
    const shop = await this.shopRepo.findById(id, user.accessToken);
    if (!shop || shop.ownerId !== user.id) {
      throw new NotFoundException("Shop not found");
    }
    return shop;
  }

  async getForGuest(shopId: string, sessionId: string): Promise<Shop> {
    const shop = await this.shopRepo.findByIdForGuest(shopId, sessionId);
    if (!shop) throw new NotFoundException("Shop not found");
    return shop;
  }

  async transferGuestShops(sessionId: string, userId: string): Promise<void> {
    return this.shopRepo.transferToUser(sessionId, userId);
  }

  async purgeGuestShopsOlderThan(hours: number): Promise<number> {
    return this.shopRepo.purgeGuestDataOlderThan(hours);
  }
}
