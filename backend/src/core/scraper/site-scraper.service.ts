import { Injectable, Logger } from "@nestjs/common";
import { load } from "cheerio";
import { assertUrlSafeForServerFetch } from "./scrape-url-policy";
import type { CmsType, ScrapePageResult } from "./scraper.types";

const FETCH_TIMEOUT_MS = 20_000;
const TEXT_SAMPLE_MAX = 12_000;

const USER_AGENT = "Mozilla/5.0 (compatible; FicheProduitBot/1.0; +https://ficheproduct.local)";

@Injectable()
export class SiteScraperService {
  private readonly logger = new Logger(SiteScraperService.name);

  async fetchPage(url: string): Promise<ScrapePageResult> {
    const safe = await assertUrlSafeForServerFetch(url);
    if (!safe.ok) {
      this.logger.warn(`fetchPage blocked URL policy: ${safe.reason} (${url})`);
      return { ok: false, error: safe.reason };
    }

    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` };
      }

      const html = await res.text();
      const cms = this.detectCms(html);
      const title = this.extractTitle(html);
      const textSample = this.extractTextSample(html);

      return { ok: true, html, cms, title, textSample };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fetch failed";
      this.logger.warn(`fetchPage(${url}) failed: ${message}`);
      return { ok: false, error: message };
    }
  }

  // ─── Méthodes extraites du SiteAnalysisService existant ──────
  // Logique inchangée — déplacement uniquement.

  detectCms(html: string): CmsType {
    const h = html.toLowerCase();
    if (h.includes("shopify") || h.includes("cdn.shopify.com")) return "shopify";
    if (h.includes("woocommerce") || h.includes("wp-content/plugins/woocommerce"))
      return "woocommerce";
    if (h.includes("prestashop") || h.includes("modules/ps_")) return "prestashop";
    return "unknown";
  }

  extractTitle(html: string): string {
    try {
      const $ = load(html);
      return $("title").first().text().trim().slice(0, 500);
    } catch {
      return "";
    }
  }

  extractTextSample(html: string): string {
    try {
      const $ = load(html);
      $("script, style, noscript, svg").remove();
      const metaDesc = $('meta[name="description"]').attr("content") ?? "";
      const body = $("body").text().replace(/\s+/g, " ").trim();
      return `${metaDesc}\n${body}`.trim().slice(0, TEXT_SAMPLE_MAX);
    } catch {
      return "";
    }
  }

  normalizeSiteUrl(input: string): string {
    const t = input.trim();
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(withProto);
    if (!u.hostname) throw new Error("Invalid URL");
    u.hash = "";
    const href = u.href.replace(/\/+$/, "");
    return href || u.origin;
  }
}
