import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { load } from 'cheerio';
import type { components } from '../../generated/api';
import { SupabaseService } from '../../auth/supabase.service';
import { GUEST_SITE_ANALYSIS_USER_ID } from './guest-site-analysis.constants';
import { buildProductListResponse } from './mock-related-products';

type SiteAnalysis = components['schemas']['SiteAnalysis'];
type CmsType = components['schemas']['CmsType'];
type ProductListResponse = components['schemas']['ProductListResponse'];

type ClassifyResult = {
  verticalSummary: string;
  catalogMatchCategories?: string[];
  brandsList?: string[];
};

/** Row shape returned by Supabase (snake_case). No current_step: API derives it from status. */
type SiteAnalysisRow = {
  id: string;
  user_id: string;
  url: string;
  status: string;
  product_count: number;
  cms_type: string | null;
  error_message: string | null;
  vertical_summary: string | null;
  catalog_match_categories: string[] | null;
  brands_list: string[] | null;
  created_at: string;
  updated_at: string;
};

const FETCH_TIMEOUT_MS = 20_000;
const TEXT_SAMPLE_MAX = 12_000;
const HEURISTIC_RULES: {
  patterns: RegExp[];
  catalogMatchCategories: string[];
  verticalSummary: string;
}[] = [
  {
    patterns: [
      /kitesurf/i,
      /kite surf/i,
      /kiteboard/i,
      /wing\s*foil/i,
      /wakestyle/i,
      /\bkite\b/i,
      /\baile(s)?\b.*\bkite/i,
    ],
    catalogMatchCategories: ['Kitesurf'],
    verticalSummary: 'des produits de kitesurf',
  },
  {
    patterns: [/vélo/i, /velo/i, /\bbike\b/i, /cyclisme/i, /\bvtt\b/i],
    catalogMatchCategories: ['Vélo'],
    verticalSummary: 'des produits de vélo',
  },
];

@Injectable()
export class SiteAnalysisService {
  /** In-flight analyses only (pending / in_progress). Persisted rows live in Supabase. */
  private readonly ephemeral = new Map<string, SiteAnalysis>();

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(
    userId: string,
    rawUrl: string,
    accessToken: string,
  ): Promise<SiteAnalysis> {
    const url = this.normalizeSiteUrl(rawUrl);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row: SiteAnalysis = {
      id,
      userId,
      url,
      status: 'pending',
      currentStep: 1,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.ephemeral.set(id, row);

    void this.runPipeline(id, url, accessToken).catch(() => {
      /* errors handled inside pipeline */
    });

    return { ...row };
  }

  async listForUser(
    userId: string,
    accessToken: string,
  ): Promise<SiteAnalysis[]> {
    const db = this.supabaseService.getClientForAccessToken(accessToken);
    const { data, error } = await db
      .from('site_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((r) => this.rowToAnalysis(r as SiteAnalysisRow));
  }

  async getForUser(
    userId: string,
    id: string,
    accessToken: string,
  ): Promise<SiteAnalysis> {
    const mem = this.ephemeral.get(id);
    if (mem && mem.userId === userId) {
      return { ...mem };
    }

    const db = this.supabaseService.getClientForAccessToken(accessToken);
    const { data, error } = await db
      .from('site_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    if (!data) {
      throw new NotFoundException('Analysis not found');
    }
    return this.rowToAnalysis(data as SiteAnalysisRow);
  }

  async getProductsForUser(
    userId: string,
    id: string,
    accessToken: string,
  ): Promise<ProductListResponse> {
    const analysis = await this.getForUser(userId, id, accessToken);
    return buildProductListResponse(id, analysis);
  }

  /**
   * Détail d’analyse pour un visiteur non connecté : uniquement les analyses invitées encore en mémoire serveur.
   */
  async getForGuest(id: string): Promise<SiteAnalysis> {
    const mem = this.ephemeral.get(id);
    if (!mem || mem.userId !== GUEST_SITE_ANALYSIS_USER_ID) {
      throw new NotFoundException('Analysis not found');
    }
    return { ...mem };
  }

  async getProductsForGuest(id: string): Promise<ProductListResponse> {
    const analysis = await this.getForGuest(id);
    return buildProductListResponse(id, analysis);
  }

  private rowToAnalysis(row: SiteAnalysisRow): SiteAnalysis {
    const catalogMatchCategories = row.catalog_match_categories?.length
      ? [...row.catalog_match_categories]
      : undefined;
    const brandsList = row.brands_list?.length ? [...row.brands_list] : undefined;
    const status = row.status as SiteAnalysis['status'];
    const currentStep: SiteAnalysis['currentStep'] =
      status === 'completed' ? 6 : 0;

    return {
      id: row.id,
      userId: row.user_id,
      url: row.url,
      status,
      currentStep,
      productCount: row.product_count,
      cmsType: (row.cms_type as CmsType | undefined) ?? undefined,
      errorMessage: row.error_message ?? undefined,
      verticalSummary: row.vertical_summary ?? undefined,
      catalogMatchCategories,
      brandsList,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private normalizeSiteUrl(input: string): string {
    const t = input.trim();
    const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    let u: URL;
    try {
      u = new URL(withProto);
    } catch {
      throw new BadRequestException('Invalid URL');
    }
    if (!u.hostname) {
      throw new BadRequestException('Invalid URL');
    }
    u.hash = '';
    const href = u.href.replace(/\/+$/, '');
    return href || u.origin;
  }

  private touchEphemeral(id: string, partial: Partial<SiteAnalysis>): void {
    const row = this.ephemeral.get(id);
    if (!row) return;
    Object.assign(row, partial, { updatedAt: new Date().toISOString() });
  }

  private async persistAnalysisToDb(
    snapshot: SiteAnalysis,
    accessToken: string,
  ): Promise<void> {
    if (!accessToken.trim()) {
      return;
    }
    if (snapshot.status !== 'completed' && snapshot.status !== 'failed') {
      return;
    }
    const db = this.supabaseService.getClientForAccessToken(accessToken);
    const { error } = await db.from('site_analyses').insert({
      id: snapshot.id,
      user_id: snapshot.userId,
      url: snapshot.url,
      status: snapshot.status,
      product_count: snapshot.productCount,
      cms_type: snapshot.cmsType ?? null,
      error_message: snapshot.errorMessage ?? null,
      vertical_summary: snapshot.verticalSummary ?? null,
      catalog_match_categories:
        snapshot.catalogMatchCategories &&
        snapshot.catalogMatchCategories.length > 0
          ? snapshot.catalogMatchCategories
          : null,
      brands_list:
        snapshot.brandsList && snapshot.brandsList.length > 0
          ? snapshot.brandsList
          : null,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  private async runPipeline(
    id: string,
    url: string,
    accessToken: string,
  ): Promise<void> {
    const finishFailed = async (message: string) => {
      this.touchEphemeral(id, {
        status: 'failed',
        errorMessage: message,
        currentStep: 0,
      });
      const snap = this.ephemeral.get(id);
      if (!snap) return;
      try {
        await this.persistAnalysisToDb(snap, accessToken);
        if (accessToken.trim()) {
          this.ephemeral.delete(id);
        }
      } catch {
        /* Keep ephemeral so the client still sees the failure if DB insert fails. */
      }
    };

    try {
      this.touchEphemeral(id, { status: 'in_progress', currentStep: 1 });

      await this.pause(150);
      this.touchEphemeral(id, { currentStep: 2 });

      const res = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; FicheProduitBot/1.0; +https://ficheproduct.local)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} lors de la récupération de la page`);
      }

      const html = await res.text();
      await this.pause(120);
      this.touchEphemeral(id, { currentStep: 3 });

      const cmsType = this.detectCms(html);
      this.touchEphemeral(id, { cmsType, currentStep: 4 });

      const textSample = this.extractTextSample(html);
      await this.pause(120);
      this.touchEphemeral(id, { currentStep: 5 });

      const classified = await this.classifySite({
        url,
        cmsType,
        textSample,
        title: this.extractTitle(html),
      });

      const catalogBuckets = this.normalizeCatalogBuckets(classified);

      this.touchEphemeral(id, {
        currentStep: 6,
        status: 'completed',
        verticalSummary: classified.verticalSummary,
        catalogMatchCategories:
          catalogBuckets.length > 0 ? catalogBuckets : undefined,
        brandsList: classified.brandsList,
        productCount: 0,
      });

      const snap = this.ephemeral.get(id);
      if (!snap) return;
      try {
        await this.persistAnalysisToDb(snap, accessToken);
        if (accessToken.trim()) {
          this.ephemeral.delete(id);
        }
      } catch {
        /* Keep ephemeral with completed data if insert fails. */
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Analyse interrompue';
      await finishFailed(message);
    }
  }

  private async pause(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
  }

  private detectCms(html: string): CmsType {
    const h = html.toLowerCase();
    if (h.includes('shopify') || h.includes('cdn.shopify.com')) {
      return 'shopify';
    }
    if (
      h.includes('woocommerce') ||
      h.includes('wp-content/plugins/woocommerce')
    ) {
      return 'woocommerce';
    }
    if (h.includes('prestashop') || h.includes('modules/ps_')) {
      return 'prestashop';
    }
    return 'unknown';
  }

  private extractTitle(html: string): string {
    try {
      const $ = load(html);
      return $('title').first().text().trim().slice(0, 500);
    } catch {
      return '';
    }
  }

  private extractTextSample(html: string): string {
    try {
      const $ = load(html);
      $('script, style, noscript, svg').remove();
      const metaDesc = $('meta[name="description"]').attr('content') ?? '';
      const body = $('body').text().replace(/\s+/g, ' ').trim();
      const chunk = `${metaDesc}\n${body}`.trim();
      return chunk.slice(0, TEXT_SAMPLE_MAX);
    } catch {
      return '';
    }
  }

  private normalizeCatalogBuckets(classified: ClassifyResult): string[] {
    const raw: string[] = [];
    if (
      Array.isArray(classified.catalogMatchCategories) &&
      classified.catalogMatchCategories.length > 0
    ) {
      for (const c of classified.catalogMatchCategories) {
        if (typeof c === 'string') {
          const t = c.trim();
          if (t) raw.push(t);
        }
      }
    }
    if (
      raw.length === 0 &&
      classified.catalogMatchCategories &&
      classified.catalogMatchCategories.length > 0
    ) {
      for (const c of classified.catalogMatchCategories) {
        if (typeof c === 'string') {
          const t = c.trim();
          if (t) raw.push(t);
        }
      }
    }
    return [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
  }

  private heuristicVerticalFragment(rule: (typeof HEURISTIC_RULES)[number]): string {
    const stripped = rule.verticalSummary
      .replace(/^des produits de\s+/i, '')
      .trim();
    if (stripped) return stripped;
    return rule.catalogMatchCategories[0] ?? '';
  }

  private classifyHeuristic(text: string): ClassifyResult {
    const matched: (typeof HEURISTIC_RULES)[number][] = [];
    for (let i = 0; i < HEURISTIC_RULES.length; i++) {
      const rule = HEURISTIC_RULES[i];
      if (rule.patterns.some((p) => p.test(text))) {
        matched.push(rule);
      }
    }

    if (matched.length === 0) {
      return {
        verticalSummary: 'des produits en ligne (secteur non précis)',
      };
    }

    const catalogMatchCategories = [
      ...new Set(matched.flatMap((r) => r.catalogMatchCategories)),
    ];

    let verticalSummary: string;
    if (matched.length === 1) {
      verticalSummary = matched[0].verticalSummary;
    } else {
      const fragments = matched
        .map((r) => this.heuristicVerticalFragment(r))
        .filter(Boolean);
      verticalSummary =
        fragments.length > 0
          ? `des produits de ${fragments.join(' et de ')}`
          : matched.map((r) => r.verticalSummary).join(' ; ');
    }

    return {
      verticalSummary,
      catalogMatchCategories,
    };
  }

  private async classifySite(input: {
    url: string;
    cmsType: CmsType;
    textSample: string;
    title: string;
  }): Promise<ClassifyResult> {
    const key = this.configService.get<string>('openaiApiKey', '');
    if (key) {
      const fromLlm = await this.classifyWithOpenAI(input);
      if (fromLlm) {
        return fromLlm;
      }
    }
    const blob = `${input.title}\n${input.textSample}`;
    return this.classifyHeuristic(blob);
  }

  private async classifyWithOpenAI(input: {
    url: string;
    cmsType: CmsType;
    textSample: string;
    title: string;
  }): Promise<ClassifyResult | null> {
    const key = this.configService.get<string>('openaiApiKey', '');
    const model = this.configService.get<string>('openaiModel', 'gpt-4o-mini');
    if (!key) return null;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You classify ecommerce homepages. Reply with JSON only: {"verticalSummary":"short French phrase starting with des/du/de la (what they sell)","catalogMatchCategories":["array of short French catalog labels aligned with Kitesurf, Vélo, Wing foil, etc.; use multiple when the shop clearly spans several verticals; empty array if unclear"],"brandsList":[] optional known brand names from the page}. No markdown.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              url: input.url,
              cmsType: input.cmsType,
              title: input.title,
              textSample: input.textSample.slice(0, 8000),
            }),
          },
        ],
      }),
    });

    if (!res.ok) {
      return null;
    }
    const data: unknown = await res.json().catch(() => ({}));
    const text = this.extractOpenAiMessageContent(data);
    if (!text) {
      return null;
    }
    try {
      const parsed = JSON.parse(text) as {
        verticalSummary?: unknown;
        catalogMatchCategories?: unknown;
        brandsList?: unknown;
      };
      const verticalSummary =
        typeof parsed.verticalSummary === 'string'
          ? parsed.verticalSummary.trim()
          : '';
      if (!verticalSummary) {
        return null;
      }
      const catalogMatchCategories = Array.isArray(
        parsed.catalogMatchCategories,
      )
        ? parsed.catalogMatchCategories
            .filter((c): c is string => typeof c === 'string')
            .map((c) => c.trim())
            .filter(Boolean)
        : undefined;
      const brandsList = Array.isArray(parsed.brandsList)
        ? parsed.brandsList.filter((b): b is string => typeof b === 'string')
        : undefined;
      return {
        verticalSummary,
        catalogMatchCategories:
          catalogMatchCategories && catalogMatchCategories.length > 0
            ? catalogMatchCategories
            : undefined,
        brandsList: brandsList?.length ? brandsList : undefined,
      };
    } catch {
      return null;
    }
  }

  private extractOpenAiMessageContent(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const choices = (data as { choices?: unknown }).choices;
    if (!Array.isArray(choices) || choices.length === 0) return null;
    const first = choices[0];
    if (!first || typeof first !== 'object') return null;
    const message = (first as { message?: unknown }).message;
    if (!message || typeof message !== 'object') return null;
    const content = (message as { content?: unknown }).content;
    if (typeof content !== 'string') return null;
    return content;
  }
}
