import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { SuggestUrlsService } from "./suggest-urls.service";

describe("SuggestUrlsService", () => {
  let service: SuggestUrlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestUrlsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<SuggestUrlsService>(SuggestUrlsService);
  });

  it("heuristicUrls builds fr/com variants from a simple name", () => {
    const urls = service.heuristicUrls("Mon Magasin");
    expect(urls).toContain("https://www.mon-magasin.fr");
    expect(urls).toContain("https://mon-magasin.com");
  });

  it("heuristicUrls returns empty for non-alphanumeric slug", () => {
    expect(service.heuristicUrls("!!!")).toEqual([]);
  });

  it("normalizeUrlList dedupes to homepages and caps length", () => {
    const urls = service.normalizeUrlList([
      "https://a.com/",
      "https://a.com/foo?x=1",
      "not-a-url",
      "https://b.com/path/",
    ]);
    expect(urls).toEqual(["https://a.com", "https://b.com"]);
  });

  it("normalizeToSuggestHomepage strips path and tracking query", () => {
    expect(
      service.normalizeToSuggestHomepage(
        "https://www.glissup.fr/marques/385-fliteboard/?srsltid=abc",
      ),
    ).toBe("https://www.glissup.fr");
  });

  it("isSocialMediaHostname flags major social hosts", () => {
    expect(service.isSocialMediaHostname("www.facebook.com")).toBe(true);
    expect(service.isSocialMediaHostname("instagram.com")).toBe(true);
    expect(service.isSocialMediaHostname("m.facebook.com")).toBe(true);
    expect(service.isSocialMediaHostname("example.com")).toBe(false);
    expect(service.isSocialMediaHostname("shop.fr")).toBe(false);
  });

  it("extractBrandTokensFromHint keeps hyphenated brands and compact form", () => {
    expect(service.extractBrandTokensFromHint("f-one")).toEqual(
      expect.arrayContaining(["f-one", "fone"]),
    );
  });

  it("prioritizeBrandRelevantUrls moves matching hosts first", () => {
    const urls = ["https://news.example.com/f-one", "https://fr.f-one.world", "https://other.com"];
    expect(service.prioritizeBrandRelevantUrls(urls, "f-one")[0]).toBe("https://fr.f-one.world");
  });
});
