import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SuggestUrlsResponse } from "./suggest-urls.types";

/** Host suffixes for social / UGC platforms excluded from suggestions. */
const SOCIAL_HOST_SUFFIXES: readonly string[] = [
  "facebook.com",
  "fb.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linkedin.com",
  "pinterest.com",
  "youtube.com",
  "youtu.be",
  "snapchat.com",
  "reddit.com",
  "threads.net",
  "tumblr.com",
  "discord.com",
  "discord.gg",
  "vk.com",
  "t.me",
  "telegram.me",
  "telegram.org",
  "whatsapp.com",
  "weibo.com",
  "bsky.app",
  "t.co",
  "line.me",
  "messenger.com",
];

const SUGGEST_URL_LIMIT = 6;
const TAVILY_MAX_RESULTS = 20;

@Injectable()
export class SuggestUrlsService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Tokens derived from a store-name hint (e.g. "f-one" → f-one, fone) for hostname boosting.
   * Exposed for tests.
   */
  extractBrandTokensFromHint(q: string): string[] {
    const s = String(q).toLowerCase().trim();
    const tokens = new Set<string>();
    for (const m of s.match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []) {
      if (m.length >= 2) tokens.add(m);
    }
    const compact = s.replace(/[^a-z0-9]/g, "");
    if (compact.length >= 3) tokens.add(compact);
    return [...tokens];
  }

  /** URLs whose host matches the hint first; order preserved within each group. Exposed for tests. */
  prioritizeBrandRelevantUrls(urls: string[], q: string): string[] {
    const tokens = this.extractBrandTokensFromHint(q);
    if (tokens.length === 0) return [...urls];

    const match: string[] = [];
    const rest: string[] = [];
    for (const u of urls) {
      let host: string;
      try {
        host = new URL(u).hostname.toLowerCase();
      } catch {
        rest.push(u);
        continue;
      }
      const relevant = tokens.some((t) => t.length >= 2 && host.includes(t));
      if (relevant) match.push(u);
      else rest.push(u);
    }
    return [...match, ...rest];
  }

  /**
   * Enrich free-text hints so Tavily surfaces official / shop homepages (not only news or social).
   */
  private buildTavilySuggestQuery(raw: string): string {
    const q = raw.trim();
    if (!q) return q;
    if (/^https?:\/\//i.test(q)) return q;
    if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(q)) return q;
    return `${q} site officiel`;
  }

  /** Exposed for tests — matches hostname or subdomain (e.g. m.facebook.com). */
  isSocialMediaHostname(hostname: string): boolean {
    const h = hostname.toLowerCase();
    for (const suffix of SOCIAL_HOST_SUFFIXES) {
      if (h === suffix || h.endsWith(`.${suffix}`)) return true;
    }
    return false;
  }

  heuristicUrls(q: string): string[] {
    const s = String(q).toLowerCase().trim();
    const slug = s
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/gi, "")
      .replace(/^-+|-+$/g, "");
    if (!slug) return [];
    const out: string[] = [];
    const add = (u: string) => {
      if (!out.includes(u)) out.push(u);
    };
    add(`https://www.${slug}.fr`);
    add(`https://${slug}.fr`);
    add(`https://www.${slug}.com`);
    add(`https://${slug}.com`);
    return out.slice(0, SUGGEST_URL_LIMIT);
  }

  normalizeUrlList(urls: unknown): string[] {
    if (!Array.isArray(urls)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of urls) {
      const u = String(item ?? "").trim();
      const home = this.normalizeToSuggestHomepage(u);
      if (!home || seen.has(home)) continue;
      seen.add(home);
      out.push(home);
    }
    return out.slice(0, SUGGEST_URL_LIMIT);
  }

  /**
   * Site homepage only: scheme + host (no path, query, or fragment).
   * Exposed for tests.
   */
  normalizeToSuggestHomepage(link: string): string | null {
    const u = String(link ?? "").trim();
    if (!/^https?:\/\//i.test(u)) return null;
    try {
      return new URL(u).origin;
    } catch {
      return null;
    }
  }

  private normalizeResultLink(link: string): string | null {
    return this.normalizeToSuggestHomepage(link);
  }

  /**
   * Tavily Search API (web results for LLM/agents).
   * @see https://docs.tavily.com/documentation/api-reference/endpoint/search
   */
  async suggestWithTavilySearch(q: string): Promise<string[] | null> {
    const key = this.configService.get<string>("tavilyApiKey");
    if (!key) return null;

    const searchDepth = this.configService.get<string>("tavilySearchDepth", "basic").trim();
    const country = this.configService.get<string>("tavilyCountry", "").trim();

    const rawQuery = String(q).trim();
    if (!rawQuery) return null;
    const query = this.buildTavilySuggestQuery(rawQuery);

    const body: Record<string, unknown> = {
      query,
      search_depth: searchDepth || "basic",
      max_results: TAVILY_MAX_RESULTS,
      include_answer: false,
    };
    if (country) body["country"] = country;

    let res: Response;
    try {
      res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      return null;
    }

    if (!res.ok) return null;

    const data: unknown = await res.json().catch(() => ({}));
    const results = (data as { results?: unknown }).results;
    if (!Array.isArray(results) || results.length === 0) return null;

    const candidates: string[] = [];
    const seen = new Set<string>();

    for (const raw of results) {
      if (!raw || typeof raw !== "object") continue;
      const link = (raw as { url?: unknown }).url;
      if (typeof link !== "string") continue;

      let hostname: string;
      try {
        hostname = new URL(link).hostname;
      } catch {
        continue;
      }

      if (this.isSocialMediaHostname(hostname)) continue;

      const normalized = this.normalizeResultLink(link);
      if (!normalized || seen.has(normalized)) continue;

      seen.add(normalized);
      candidates.push(normalized);
    }

    if (candidates.length === 0) return null;

    const collected = this.prioritizeBrandRelevantUrls(candidates, rawQuery).slice(
      0,
      SUGGEST_URL_LIMIT,
    );

    return collected.length ? collected : null;
  }

  async suggest(q: string): Promise<SuggestUrlsResponse> {
    let urls: string[] | null = null;
    try {
      urls = await this.suggestWithTavilySearch(q);
    } catch {
      urls = null;
    }
    if (!urls || urls.length === 0) {
      urls = this.heuristicUrls(q);
    }
    return { urls };
  }
}
