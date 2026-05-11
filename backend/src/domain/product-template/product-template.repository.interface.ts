import type {
  ProductTemplate,
  CreateProductTemplate,
  UpdateProductTemplate,
} from "./types/product-template.types";

export interface IProductTemplateRepository {
  findById(id: string, accessToken: string): Promise<ProductTemplate | null>;
  findAllByShop(shopId: string, accessToken: string): Promise<ProductTemplate[]>;
  create(
    data: CreateProductTemplate,
    accessToken: string,
    clientId: string,
  ): Promise<ProductTemplate>;
  update(id: string, data: UpdateProductTemplate, accessToken: string): Promise<ProductTemplate>;
  delete(id: string, accessToken: string): Promise<void>;
}

export const PRODUCT_TEMPLATE_REPOSITORY = Symbol("IProductTemplateRepository");
