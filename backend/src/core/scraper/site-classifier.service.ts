import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { load } from "cheerio";
import { normalizeShopSector, SHOP_SECTOR_VALUES } from "../../domain/shop/dto/shop-sector.schema";
import type { CmsType, ClassifyResult } from "./scraper.types";
import { HEURISTIC_RULES } from "./scraper.constants";

const SHOP_SECTOR_LABELS_PROMPT = SHOP_SECTOR_VALUES.join(", ");

@Injectable()
export class SiteClassifierService {
  private readonly logger = new Logger(SiteClassifierService.name);

  constructor(private readonly config: ConfigService) {}

  async classify(input: {
    url: string;
    html: string; // SiteScraperService fournit déjà title + textSample
    cms?: CmsType;
    title?: string;
    textSample?: string;
  }): Promise<ClassifyResult> {
    const title = input.title ?? "";
    const textSample = input.textSample ?? "";
    const htmlBrands = this.extractBrandsFromHtml(input.html);

    // Essai IA d'abord
    const apiKey = this.config.get<string>("openaiApiKey");
    if (apiKey) {
      try {
        const fromAi = await this.classifyWithOpenAI({
          url: input.url,
          cms: input.cms ?? "unknown",
          title,
          textSample,
        });
        if (fromAi) {
          return this.mergeBrands(fromAi, htmlBrands);
        }
      } catch (err) {
        this.logger.warn("OpenAI classification failed, falling back to heuristics", err);
      }
    }

    // Fallback heuristiques
    return this.mergeBrands(this.classifyHeuristic(`${title}\n${textSample}`), htmlBrands);
  }

  /** Fusionne les marques IA/heuristiques avec celles extraites du HTML. */
  private mergeBrands(result: ClassifyResult, htmlBrands: string[]): ClassifyResult {
    if (htmlBrands.length === 0) return result;
    const seen = new Set(result.brands.map((b) => b.toLocaleLowerCase()));
    const merged = [...result.brands];
    for (const brand of htmlBrands) {
      const key = brand.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(brand);
    }
    return { ...result, brands: merged };
  }

  /**
   * Marques depuis liens fabricant / brand (PrestaShop, WooCommerce, etc.).
   */
  private extractBrandsFromHtml(html: string): string[] {
    try {
      const $ = load(html);
      const brands: string[] = [];
      const seen = new Set<string>();
      $("a[href]").each((_, el) => {
        if (brands.length >= 20) return;
        const href = (($(el).attr("href") ?? "") + "").toLowerCase();
        if (!/\/(brand|brands|manufacturer|manufacturers|marque|marques)(\/|$)/i.test(href)) {
          return;
        }
        const name = $(el).text().replace(/\s+/g, " ").trim();
        if (!name || name.length < 2 || name.length > 60) return;
        const key = name.toLocaleLowerCase();
        if (seen.has(key)) return;
        if (/^(marques?|brands?|manufacturers?|tous|all|voir)$/i.test(name)) return;
        seen.add(key);
        brands.push(name);
      });
      return brands;
    } catch {
      return [];
    }
  }

  private async classifyWithOpenAI(input: {
    url: string;
    cms: CmsType;
    textSample: string;
    title: string;
  }): Promise<ClassifyResult | null> {
    const key = this.config.get<string>("openaiApiKey");
    const model = this.config.get<string>("openaiModel", "gpt-4o-mini");
    if (!key) return null;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You classify ecommerce homepages. Reply with JSON only: " +
              '{"verticalSummary":"short French phrase starting with des/du/de la",' +
              '"catalogMatchCategories":["exactly one sector label from the allowed list, or empty if unclear"],' +
              '"brandsList":["optional known brand names"]}. ' +
              `Allowed sector labels (use exact spelling): ${SHOP_SECTOR_LABELS_PROMPT}. ` +
              "catalogMatchCategories[0] must be one of these labels or the array must be empty. No markdown.",
          },
          {
            role: "user",
            content: JSON.stringify({
              url: input.url,
              cmsType: input.cms,
              title: input.title,
              textSample: input.textSample.slice(0, 8000),
            }),
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return null;

    try {
      const parsed = JSON.parse(text) as {
        verticalSummary?: string;
        catalogMatchCategories?: unknown[];
        brandsList?: unknown[];
      };

      const verticalSummary =
        typeof parsed.verticalSummary === "string" ? parsed.verticalSummary.trim() : null;

      const categories = Array.isArray(parsed.catalogMatchCategories)
        ? parsed.catalogMatchCategories
            .filter((c): c is string => typeof c === "string")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];

      const brands = Array.isArray(parsed.brandsList)
        ? parsed.brandsList.filter((b): b is string => typeof b === "string")
        : [];

      if (!verticalSummary) return null;

      return this.normalizeClassifyResult({
        sector: categories[0] ?? null,
        categories,
        brands,
        verticalSummary,
      });
    } catch {
      return null;
    }
  }

  private classifyHeuristic(text: string): ClassifyResult {
    const matched = HEURISTIC_RULES.filter((rule) => rule.patterns.some((p) => p.test(text)));

    if (matched.length === 0) {
      return {
        sector: null,
        categories: [],
        brands: [],
        verticalSummary: null,
      };
    }

    const categories = [...new Set(matched.flatMap((r) => r.categories))];

    const verticalSummary =
      matched.length === 1
        ? matched[0].verticalSummary
        : `des produits de ${matched
            .map((r) => r.verticalSummary.replace(/^des produits de\s+/i, "").trim())
            .filter(Boolean)
            .join(" et de ")}`;

    return this.normalizeClassifyResult({
      sector: categories[0] ?? null,
      categories,
      brands: [],
      verticalSummary,
    });
  }

  private normalizeClassifyResult(result: ClassifyResult): ClassifyResult {
    const sector = normalizeShopSector(result.sector);
    return { ...result, sector };
  }
}
