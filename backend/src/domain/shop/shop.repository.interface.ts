import type { CreateShop, Shop, UpdateShop, UpsertShopFromAnalysis } from "./types/shop.types";

export interface IShopRepository {
  findById(id: string, accessToken: string): Promise<Shop | null>;
  findByIdForGuest(id: string, sessionId: string): Promise<Shop | null>;
  findAllByOwner(ownerId: string, accessToken: string): Promise<Shop[]>;

  create(data: CreateShop, accessToken: string): Promise<Shop>;
  update(id: string, data: UpdateShop, accessToken: string): Promise<Shop>;
  upsertFromAnalysis(data: UpsertShopFromAnalysis, accessToken: string): Promise<Shop>;

  transferToUser(sessionId: string, userId: string): Promise<void>;
  purgeGuestDataOlderThan(hours: number): Promise<number>;
}

export const SHOP_REPOSITORY = Symbol("IShopRepository");
