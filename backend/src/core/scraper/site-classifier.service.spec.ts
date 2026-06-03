import { ConfigService } from "@nestjs/config";

import { SiteClassifierService } from "./site-classifier.service";

describe("SiteClassifierService", () => {
  const configMock = {
    get: jest.fn((key: string) => {
      if (key === "openaiApiKey") return undefined;
      return undefined;
    }),
  } as unknown as ConfigService;

  const service = new SiteClassifierService(configMock);

  it("heuristique kitesurf → secteur Glisse", async () => {
    const result = await service.classify({
      url: "https://kite.example",
      html: "",
      title: "Boutique kitesurf",
      textSample: "planches kite et ailes",
    });

    expect(result.sector).toBe("Glisse");
  });

  it("heuristique vélo → secteur Vélo", async () => {
    const result = await service.classify({
      url: "https://velo.example",
      html: "",
      title: "VTT et gravel",
      textSample: "vélo route cyclisme",
    });

    expect(result.sector).toBe("Vélo");
  });

  it("texte sans correspondance → secteur null", async () => {
    const result = await service.classify({
      url: "https://generic.example",
      html: "",
      title: "Boutique générique",
      textSample: "produits divers",
    });

    expect(result.sector).toBeNull();
  });
});
