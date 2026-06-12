import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  PRODUCT_TEMPLATE_REPOSITORY,
  type IProductTemplateRepository,
} from "./product-template.repository.interface";
import { ScrapeFieldsService } from "./sub-services/scrape-fields.service";
import { RefineFieldsService } from "./sub-services/refine-fields.service";
import type {
  ProductTemplate,
  CreateProductTemplate,
  UpdateProductTemplate,
  ScrapeFieldsResult,
  RefineFieldsResult,
  ProductTemplateField,
} from "./types/product-template.types";
import type { AuthenticatedUser } from "../../core/auth/types/jwt-payload.types";
import { ShopService } from "../shop/shop.service";

@Injectable()
export class ProductTemplateService {
  constructor(
    @Inject(PRODUCT_TEMPLATE_REPOSITORY)
    private readonly templateRepo: IProductTemplateRepository,
    private readonly shopService: ShopService,
    private readonly scrapeFields: ScrapeFieldsService,
    private readonly refineFields: RefineFieldsService,
  ) {}

  async listForShop(shopId: string, user: AuthenticatedUser): Promise<ProductTemplate[]> {
    await this.shopService.getForUser(shopId, user);
    return this.templateRepo.findAllByShop(shopId, user.accessToken);
  }

  async getOneInShop(
    shopId: string,
    id: string,
    user: AuthenticatedUser,
  ): Promise<ProductTemplate> {
    await this.shopService.getForUser(shopId, user);
    const template = await this.templateRepo.findById(id, user.accessToken);
    if (!template || template.shopId !== shopId) {
      throw new NotFoundException("Gabarit introuvable");
    }
    return template;
  }

  async getTemplateForShop(
    templateId: string,
    shopId: string,
    user: AuthenticatedUser,
  ): Promise<ProductTemplate | null> {
    await this.shopService.getForUser(shopId, user);
    const template = await this.templateRepo.findById(templateId, user.accessToken);
    if (!template || template.shopId !== shopId) return null;
    return template;
  }

  async create(data: CreateProductTemplate, user: AuthenticatedUser): Promise<ProductTemplate> {
    await this.shopService.getForUser(data.shopId, user);
    await this.assertUniqueTemplateName(data.shopId, data.name, user, undefined);
    return this.templateRepo.create(data, user.accessToken, user.id);
  }

  async updateInShop(
    shopId: string,
    id: string,
    patch: UpdateProductTemplate,
    user: AuthenticatedUser,
  ): Promise<ProductTemplate> {
    await this.getOneInShop(shopId, id, user);
    if (patch.name !== undefined) {
      await this.assertUniqueTemplateName(shopId, patch.name, user, id);
    }
    return this.templateRepo.update(id, patch, user.accessToken);
  }

  private async assertUniqueTemplateName(
    shopId: string,
    name: string,
    user: AuthenticatedUser,
    excludeId: string | undefined,
  ): Promise<void> {
    const exists = await this.templateRepo.existsByNameInShop(
      shopId,
      name,
      user.accessToken,
      excludeId,
    );
    if (exists) {
      throw new ConflictException("Une fiche avec ce nom existe déjà.");
    }
  }

  async deleteInShop(shopId: string, id: string, user: AuthenticatedUser): Promise<void> {
    await this.getOneInShop(shopId, id, user);
    return this.templateRepo.delete(id, user.accessToken);
  }

  async scrapeFromUrl(
    shopId: string,
    user: AuthenticatedUser,
    url: string,
  ): Promise<ScrapeFieldsResult> {
    await this.shopService.getForUser(shopId, user);
    return this.scrapeFields.scrape(url);
  }

  async refineWithAi(
    shopId: string,
    user: AuthenticatedUser,
    fields: Array<Pick<ProductTemplateField, "name" | "type" | "required"> & { order?: number }>,
    source: "csv_import" | "product_page" | "manual",
    sampleValues?: Record<string, string>,
  ): Promise<RefineFieldsResult> {
    await this.shopService.getForUser(shopId, user);
    const withOrder: ProductTemplateField[] = fields.map((f, i) => ({
      name: f.name,
      type: f.type,
      required: f.required ?? false,
      order: typeof f.order === "number" ? f.order : i,
    }));
    return this.refineFields.refine(withOrder, source, sampleValues);
  }
}
