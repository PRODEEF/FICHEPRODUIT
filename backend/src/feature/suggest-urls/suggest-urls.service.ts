import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SuggestUrlsResponse } from './suggest-urls.types';

@Injectable()
export class SuggestUrlsService {
  constructor(private readonly configService: ConfigService) {}

  heuristicUrls(q: string): string[] {
    const s = String(q).toLowerCase().trim();
    const slug = s
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .replace(/^-+|-+$/g, '');
    if (!slug) return [];
    const out: string[] = [];
    const add = (u: string) => {
      if (!out.includes(u)) out.push(u);
    };
    add(`https://www.${slug}.fr`);
    add(`https://${slug}.fr`);
    add(`https://www.${slug}.com`);
    add(`https://${slug}.com`);
    return out;
  }

  normalizeUrlList(urls: unknown): string[] {
    if (!Array.isArray(urls)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of urls) {
      const u = String(item ?? '').trim();
      if (!/^https?:\/\//i.test(u)) continue;
      try {
        const parsed = new URL(u);
        const href = parsed.href.replace(/\/+$/, '') || parsed.origin;
        if (!seen.has(href)) {
          seen.add(href);
          out.push(href);
        }
      } catch {
        /* skip invalid */
      }
    }
    return out.slice(0, 8);
  }

  async suggestWithOpenAI(q: string): Promise<string[] | null> {
    const key = this.configService.get<string>('openaiApiKey', '');
    if (!key) return null;

    const model = this.configService.get<string>('openaiModel', 'gpt-4o-mini');
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
              'You resolve store names or short French descriptions to likely official ecommerce homepages. ' +
              'Reply with JSON only: {"urls":["https://..."]} — 3 to 6 URLs, best guess first. ' +
              'Use https. No markdown, no extra keys.',
          },
          { role: 'user', content: String(q).trim() },
        ],
      }),
    });

    if (!res.ok) return null;
    const data: unknown = await res.json().catch(() => ({}));
    const text = this.extractOpenAiMessageContent(data);
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as { urls?: unknown };
      const list = this.normalizeUrlList(parsed.urls);
      return list.length ? list : null;
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

  async suggest(q: string): Promise<SuggestUrlsResponse> {
    let urls: string[] | null = null;
    try {
      urls = await this.suggestWithOpenAI(q);
    } catch {
      urls = null;
    }
    if (!urls || urls.length === 0) {
      urls = this.heuristicUrls(q);
    }
    return { urls };
  }
}
