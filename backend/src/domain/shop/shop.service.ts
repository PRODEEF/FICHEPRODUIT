import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import type { CmsType } from "../../core/scraper/scraper.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { mergeShopBrands, mergeShopCategoryTrees } from "./shop-catalog-merge";
import { SHOP_REPOSITORY, type IShopRepository } from "./shop.repository.interface";
import type { Shop, ShopCms, UpdateShop } from "./types/shop.types";
import type { ShopCategoryNode } from "./types/shop-category.types";

/** TLD courants pour extraire le label principal du hostname. */
const COMMON_TLDS = new Set([
  "com",
  "fr",
  "net",
  "org",
  "io",
  "co",
  "eu",
  "be",
  "ch",
  "uk",
  "de",
  "es",
  "it",
  "nl",
  "pt",
  "shop",
  "store",
]);

/**
 * Normalise une URL boutique pour comparaison (protocole https, hostname sans www, sans slash final).
 */
export function normalizeShopUrlForComparison(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.protocol}//${host}${path === "/" ? "" : path}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, "");
  }
}

export function shopUrlsEquivalent(a: string, b: string): boolean {
  const left = normalizeShopUrlForComparison(a);
  const right = normalizeShopUrlForComparison(b);
  if (!left || !right) return false;
  return left === right;
}

/**
 * Dérive un nom d’affichage depuis l’URL : `glissup.fr` → `Glissup`, `shop.exemple.com` → `Exemple`.
 */
export function shopDisplayNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (!host) return url;

    const parts = host.split(".").filter(Boolean);
    if (parts.length === 0) return url;

    let label = parts[0] ?? host;
    if (parts.length >= 2) {
      const last = parts[parts.length - 1] ?? "";
      const secondLast = parts[parts.length - 2] ?? "";
      // ex. exemple.co.uk → Exemple ; shop.glissup.fr → Glissup
      if (COMMON_TLDS.has(last) && parts.length >= 2) {
        label =
          parts.length >= 3 && COMMON_TLDS.has(secondLast) ? parts[parts.length - 3]! : secondLast;
      } else {
        label = parts[parts.length - 2] ?? parts[0]!;
      }
    }

    if (!label) return url;
    return label.charAt(0).toUpperCase() + label.slice(1);
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

/**
 * Conserve marques/catégories si l’URL existante est non vide et équivalente à la nouvelle.
 * Première analyse (URL vide) ou changement d’URL → écrasement.
 */
function shouldPreserveCatalogData(existingUrl: string, nextUrl: string): boolean {
  return Boolean(existingUrl.trim()) && shopUrlsEquivalent(existingUrl, nextUrl);
}

/**
 * Garde un nom personnalisé lors d’une ré-analyse (même URL) ;
 * sinon applique le nom dérivé de l’URL.
 */
function resolveShopNameFromAnalysis(existing: Shop, nextUrl: string, preserve: boolean): string {
  const generatedFromNext = shopDisplayNameFromUrl(nextUrl);
  if (!preserve) return generatedFromNext;

  const current = existing.name.trim();
  if (!current || current === DEFAULT_SHOP_NAME) return generatedFromNext;

  const generatedFromExisting = existing.url.trim() ? shopDisplayNameFromUrl(existing.url) : "";
  if (generatedFromExisting && current === generatedFromExisting) {
    return generatedFromNext;
  }

  return current;
}

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
   * - même URL : fusionne marques et catégories détectées avec l’existant
   * - URL différente : remplace marques et catégories
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
    const cms = mapScraperCmsToShopCms(input.cms);

    if (input.ownerId) {
      const shops = await this.shopRepo.findAllByOwner(input.ownerId, accessToken);
      const primary = this.pickPrimaryShop(shops);
      if (primary) {
        const preserve = shouldPreserveCatalogData(primary.url, input.url);
        const name = resolveShopNameFromAnalysis(primary, input.url, preserve);

        const patch: UpdateShop = {
          name,
          url: input.url,
          cms,
          ...(primary.sector?.trim() ? {} : input.sector?.trim() ? { sector: input.sector } : {}),
          brands: preserve ? mergeShopBrands(primary.brands, input.brands) : input.brands,
          categoryTree: preserve
            ? mergeShopCategoryTrees(primary.categoryTree, input.categoryTree)
            : input.categoryTree,
        };

        return this.shopRepo.update(primary.id, patch, accessToken);
      }
    }

    const name = shopDisplayNameFromUrl(input.url);
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
