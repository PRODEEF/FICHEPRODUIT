import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

import { ShopService } from "./shop.service";
import { type IShopRepository } from "./shop.repository.interface";
import type { Shop } from "./types/shop.types";

describe("ShopService", () => {
  const repo: jest.Mocked<IShopRepository> = {
    findById: jest.fn(),
    findByIdForGuest: jest.fn(),
    findAllByOwner: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsertFromAnalysis: jest.fn(),
    transferToUser: jest.fn(),
    purgeGuestDataOlderThan: jest.fn(),
  };

  const service = new ShopService(repo);

  const sampleShop: Shop = {
    id: "shop-1",
    name: "Existant",
    url: "https://exemple.fr",
    cms: "shopify",
    sector: null,
    brands: [],
    categoryTree: [],
    ownerId: "user-1",
    sessionId: null,
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getMyShop renvoie le magasin existant sans création", async () => {
    repo.findAllByOwner.mockResolvedValue([sampleShop]);

    await expect(service.getMyShop("user-1", "tok")).resolves.toBe(sampleShop);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("getMyShop préfère une boutique avec URL à une fiche Mon magasin vide", async () => {
    const emptyDefault: Shop = {
      ...sampleShop,
      id: "shop-empty",
      name: "Mon magasin",
      url: "",
      cms: "inconnu",
      updatedAt: "2025-06-01T00:00:00.000Z",
    };
    const fromGuest: Shop = {
      ...sampleShop,
      id: "shop-guest",
      name: "exemple.fr",
      url: "https://exemple.fr",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };
    repo.findAllByOwner.mockResolvedValue([emptyDefault, fromGuest]);

    await expect(service.getMyShop("user-1", "tok")).resolves.toBe(fromGuest);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("getMyShop crée un magasin minimal si aucun", async () => {
    const created: Shop = {
      ...sampleShop,
      id: "shop-new",
      name: "Mon magasin",
      url: "",
      cms: "inconnu",
    };
    repo.findAllByOwner.mockResolvedValueOnce([]);
    repo.create.mockResolvedValue(created);

    await expect(service.getMyShop("user-1", "tok")).resolves.toEqual(created);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Mon magasin",
        url: "",
        cms: "inconnu",
        sector: null,
        brands: [],
        categoryTree: [],
        ownerId: "user-1",
        sessionId: null,
      }),
      "tok",
    );
  });

  it("getMyShop récupère le magasin après échec de création (concurrence)", async () => {
    repo.findAllByOwner.mockResolvedValueOnce([]).mockResolvedValueOnce([sampleShop]);
    repo.create.mockRejectedValue(new Error("insert race"));

    await expect(service.getMyShop("user-1", "tok")).resolves.toBe(sampleShop);
  });

  it("getMyShop lève une erreur serveur si création et relecure vides", async () => {
    repo.findAllByOwner.mockResolvedValue([]);
    repo.create.mockRejectedValue(new Error("db"));

    await expect(service.getMyShop("user-1", "tok")).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it("updateMyShop assure un magasin puis met à jour", async () => {
    const shop = { ...sampleShop, id: "shop-x", url: "" };
    repo.findAllByOwner.mockResolvedValueOnce([]);
    repo.create.mockResolvedValue(shop);
    repo.update.mockResolvedValue({ ...shop, name: "Renommé" });

    const out = await service.updateMyShop("user-1", { name: "Renommé" }, "tok");

    expect(out.name).toBe("Renommé");
    expect(repo.update).toHaveBeenCalledWith("shop-x", { name: "Renommé" }, "tok");
  });

  it("updateMyShop autorise la première saisie du secteur", async () => {
    repo.findAllByOwner.mockResolvedValue([sampleShop]);
    repo.update.mockResolvedValue({ ...sampleShop, sector: "Vélo" });

    const out = await service.updateMyShop("user-1", { sector: "Vélo" }, "tok");

    expect(out.sector).toBe("Vélo");
    expect(repo.update).toHaveBeenCalledWith("shop-1", { sector: "Vélo" }, "tok");
  });

  it("updateMyShop refuse de modifier un secteur déjà renseigné", async () => {
    const shopWithSector = { ...sampleShop, sector: "Glisse" };
    repo.findAllByOwner.mockResolvedValue([shopWithSector]);

    await expect(service.updateMyShop("user-1", { sector: "Vélo" }, "tok")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("updateMyShop refuse d'effacer un secteur déjà renseigné", async () => {
    const shopWithSector = { ...sampleShop, sector: "Glisse" };
    repo.findAllByOwner.mockResolvedValue([shopWithSector]);

    await expect(service.updateMyShop("user-1", { sector: null }, "tok")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("createOrUpdateFromAnalysis met à jour le magasin principal connecté (URL vide → écrit marques)", async () => {
    const emptyPrimary: Shop = {
      ...sampleShop,
      id: "shop-primary",
      name: "Mon magasin",
      url: "",
      cms: "inconnu",
      brands: [],
      categoryTree: [],
    };
    const updated: Shop = {
      ...emptyPrimary,
      name: "Exemple",
      url: "https://exemple.fr",
      cms: "prestashop",
      brands: ["Nike"],
      categoryTree: [{ id: "c1", name: "Chaussures", children: [] }],
    };
    repo.findAllByOwner.mockResolvedValue([emptyPrimary]);
    repo.update.mockResolvedValue(updated);

    const out = await service.createOrUpdateFromAnalysis(
      {
        url: "https://exemple.fr",
        cms: "prestashop",
        sector: null,
        brands: ["Nike"],
        categoryTree: [{ id: "c1", name: "Chaussures", children: [] }],
        ownerId: "user-1",
        sessionId: null,
      },
      "tok",
    );

    expect(out).toBe(updated);
    expect(repo.update).toHaveBeenCalledWith(
      "shop-primary",
      expect.objectContaining({
        name: "Exemple",
        url: "https://exemple.fr",
        cms: "prestashop",
        brands: ["Nike"],
        categoryTree: [{ id: "c1", name: "Chaussures", children: [] }],
      }),
      "tok",
    );
    expect(repo.upsertFromAnalysis).not.toHaveBeenCalled();
  });

  it("createOrUpdateFromAnalysis fusionne marques/catégories si même URL", async () => {
    const primary: Shop = {
      ...sampleShop,
      id: "shop-primary",
      name: "Ma boutique",
      url: "https://www.exemple.fr/",
      cms: "prestashop",
      brands: ["Nike"],
      categoryTree: [{ id: "c1", name: "Chaussures", children: [] }],
    };
    repo.findAllByOwner.mockResolvedValue([primary]);
    repo.update.mockResolvedValue(primary);

    await service.createOrUpdateFromAnalysis(
      {
        url: "https://exemple.fr",
        cms: "shopify",
        sector: null,
        brands: ["Adidas"],
        categoryTree: [{ id: "c2", name: "Autre", children: [] }],
        ownerId: "user-1",
        sessionId: null,
      },
      "tok",
    );

    expect(repo.update).toHaveBeenCalledWith(
      "shop-primary",
      expect.objectContaining({
        name: "Ma boutique",
        url: "https://exemple.fr",
        cms: "shopify",
        brands: ["Nike", "Adidas"],
        categoryTree: [
          { id: "c1", name: "Chaussures", children: [] },
          expect.objectContaining({ name: "Autre", children: [] }),
        ],
      }),
      "tok",
    );
  });

  it("createOrUpdateFromAnalysis remplace marques/catégories si URL différente", async () => {
    const primary: Shop = {
      ...sampleShop,
      id: "shop-primary",
      name: "Ancien",
      url: "https://ancien.fr",
      cms: "prestashop",
      brands: ["Nike"],
      categoryTree: [{ id: "c1", name: "Chaussures", children: [] }],
    };
    repo.findAllByOwner.mockResolvedValue([primary]);
    repo.update.mockResolvedValue(primary);

    await service.createOrUpdateFromAnalysis(
      {
        url: "https://nouveau.fr",
        cms: "shopify",
        sector: null,
        brands: ["Adidas"],
        categoryTree: [{ id: "c2", name: "Autre", children: [] }],
        ownerId: "user-1",
        sessionId: null,
      },
      "tok",
    );

    expect(repo.update).toHaveBeenCalledWith(
      "shop-primary",
      expect.objectContaining({
        name: "Nouveau",
        url: "https://nouveau.fr",
        cms: "shopify",
        brands: ["Adidas"],
        categoryTree: [{ id: "c2", name: "Autre", children: [] }],
      }),
      "tok",
    );
  });
});
