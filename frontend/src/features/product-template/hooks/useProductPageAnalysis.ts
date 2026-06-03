import { useCallback, useEffect, useState } from 'react';

import { scrapeFields } from '@api/template';
import type { ProductTemplateField } from '@types-api';

export interface ProductPageAnalysisResult {
  fields: ProductTemplateField[];
  sampleValues: Record<string, string>;
  warnings: { code: string; message: string }[];
}

export interface UseProductPageAnalysisResult {
  scrapeUrl: string;
  setScrapeUrl: (value: string) => void;
  scraping: boolean;
  urlEmptyError: boolean;
  scrapeNotes: string | null;
  clearScrapeNotes: () => void;
  analyze: () => Promise<ProductPageAnalysisResult | null>;
}

export function useProductPageAnalysis(
  shopId: string | undefined,
  defaultWebsiteUrl: string | null | undefined,
): UseProductPageAnalysisResult {
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [urlEmptyError, setUrlEmptyError] = useState(false);
  const [scrapeNotes, setScrapeNotes] = useState<string | null>(null);

  useEffect(() => {
    const site = defaultWebsiteUrl?.trim();
    if (!site) return;
    queueMicrotask(() => {
      setScrapeUrl((prev) => (prev.trim() === '' ? site : prev));
    });
  }, [defaultWebsiteUrl]);

  const analyze = useCallback(async (): Promise<ProductPageAnalysisResult | null> => {
    if (!shopId) {
      throw new Error('Boutique introuvable. Analysez d’abord votre site.');
    }
    const url = scrapeUrl.trim();
    if (!url) {
      setUrlEmptyError(true);
      return null;
    }
    setUrlEmptyError(false);
    setScraping(true);
    setScrapeNotes(null);
    try {
      const res = await scrapeFields(shopId, { url });
      const userWarnings = res.warnings.filter((w) => w.code !== "DUPLICATE_MERGED");
      if (userWarnings.length > 0) {
        setScrapeNotes(userWarnings.map((w) => `${w.code}: ${w.message}`).join(' · '));
      }
      const sampleValues =
        Object.keys(res.sampleValues).length > 0 ? res.sampleValues : {};
      return {
        fields: res.fields,
        sampleValues,
        warnings: res.warnings,
      };
    } finally {
      setScraping(false);
    }
  }, [shopId, scrapeUrl]);

  const clearScrapeNotes = useCallback(() => {
    setScrapeNotes(null);
  }, []);

  return {
    scrapeUrl,
    setScrapeUrl: (value: string) => {
      setScrapeUrl(value);
      setUrlEmptyError(false);
    },
    scraping,
    urlEmptyError,
    scrapeNotes,
    clearScrapeNotes,
    analyze,
  };
}
