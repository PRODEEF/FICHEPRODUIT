import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { CmsType } from "../../core/scraper/scraper.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { SHOP_REPOSITORY, type IShopRepository } from "./shop.repository.interface";
import type { Shop, ShopCms } from "./types/shop.types";
import type { ShopCategoryNode } from "./types/shop-category.types";

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

const DEFAULT_SHOP_NAME = "Mon magasin";

@Injectable()
export class ShopService {
  constructor(
    @Inject(SHOP_REPOSITORY)
    private readonly shopRepo: IShopRepository,
  ) {}

  /**
   * Création ou mise à jour depuis le pipeline d’analyse.
   * - connecté : met à jour le magasin principal du compte (évite un 2ᵉ shop)
   * - invité : upsert via sessionId + URL
   */
  async createOrUpdateFromAnalysis(
    input: {
      url: string;
      cms: CmsType;
      sector: string | null;
      brands: string[];
      categoryTree: ShopCategoryNode[];
      ownerId: string | null;
      sessionId: string | null;
    },
    accessToken: string,
  ): Promise<Shop> {
    const name = shopDisplayNameFromUrl(input.url);
    const cms = mapScraperCmsToShopCms(input.cms);

    if (input.ownerId) {
      const shops = await this.shopRepo.findAllByOwner(input.ownerId, accessToken);
      const primary = this.pickPrimaryShop(shops);
      if (primary) {
        return this.shopRepo.update(
          primary.id,
          {
            name,
            url: input.url,
            cms,
            brands: input.brands,
            categoryTree: input.categoryTree,
            ...(primary.sector?.trim() ? {} : { sector: input.sector }),
          },
          accessToken,
        );
      }
    }

    return this.shopRepo.upsertFromAnalysis(
      {
        name,
        url: input.url,
        cms,
        sector: input.sector,
        brands: input.brands,
        categoryTree: input.categoryTree,
        ownerId: input.ownerId,
        sessionId: input.sessionId,
      },
      accessToken,
    );
  }

  /**
   * Magasin principal du compte : crée une fiche minimale (URL vide, CMS inconnu)
   * si l’utilisateur n’en a encore aucune (ex. inscription sans analyse de site).
   */
  async getMyShop(ownerId: string, accessToken: string): Promise<Shop> {
    return this.getOrCreateMyShop(ownerId, accessToken);
  }

  async updateMyShop(
    ownerId: string,
    dto: Partial<{
      name: string;
      url: string;
      cms: ShopCms;
      sector: string | null;
      brands: string[];
      categoryTree: ShopCategoryNode[];
    }>,
    accessToken: string,
  ): Promise<Shop> {
    const shop = await this.getOrCreateMyShop(ownerId, accessToken);
    if (dto.sector !== undefined) {
      const currentSector = shop.sector?.trim() ? shop.sector : null;
      if (currentSector !== null) {
        if (dto.sector === null) {
          throw new BadRequestException("Le secteur ne peut plus être modifié.");
        }
        if (dto.sector !== currentSector) {
          throw new BadRequestException("Le secteur ne peut plus être modifié.");
        }
      }
    }
    return this.shopRepo.update(shop.id, dto, accessToken);
  }

  /** Évite de renvoyer une fiche « Mon magasin » vide créée avant le claim guest. */
  private pickPrimaryShop(shops: Shop[]): Shop | undefined {
    if (shops.length === 0) return undefined;
    const score = (shop: Shop): number => {
      if (shop.url.trim().length > 0) return 2;
      if (shop.name !== DEFAULT_SHOP_NAME) return 1;
      return 0;
    };
    const sorted = [...shops].sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return sorted[0];
  }

  private async getOrCreateMyShop(ownerId: string, accessToken: string): Promise<Shop> {
    const shops = await this.shopRepo.findAllByOwner(ownerId, accessToken);
    const existing = this.pickPrimaryShop(shops);
    if (existing) {
      return existing;
    }

    try {
      return await this.shopRepo.create(
        {
          name: DEFAULT_SHOP_NAME,
          url: "",
          cms: "inconnu",
          sector: null,
          brands: [],
          categoryTree: [],
          ownerId,
          sessionId: null,
        },
        accessToken,
      );
    } catch {
      const again = await this.shopRepo.findAllByOwner(ownerId, accessToken);
      const recovered = this.pickPrimaryShop(again);
      if (recovered) {
        return recovered;
      }
      throw new InternalServerErrorException("Échec de la création de la boutique par défaut");
    }
  }

  async getForUser(id: string, user: AuthenticatedUser): Promise<Shop> {
    const shop = await this.shopRepo.findById(id, user.accessToken);
    if (!shop || shop.ownerId !== user.id) {
      throw new NotFoundException("Boutique introuvable");
    }
    return shop;
  }

  async getForGuest(shopId: string, sessionId: string): Promise<Shop> {
    const shop = await this.shopRepo.findByIdForGuest(shopId, sessionId);
    if (!shop) throw new NotFoundException("Boutique introuvable");
    return shop;
  }

  async transferGuestShops(sessionId: string, userId: string): Promise<void> {
    return this.shopRepo.transferToUser(sessionId, userId);
  }

  async purgeGuestShopsOlderThan(hours: number): Promise<number> {
    return this.shopRepo.purgeGuestDataOlderThan(hours);
  }
}
