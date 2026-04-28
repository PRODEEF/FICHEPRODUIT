import { createHash } from 'crypto';
import type { components } from '../../generated/api';

type SiteAnalysis = components['schemas']['SiteAnalysis'];
type Product = components['schemas']['Product'];
type ProductListResponse = components['schemas']['ProductListResponse'];

type MockProductSeed = {
  title: string;
  brand: string;
  category: string;
  subCategory: string;
  year?: string;
  price?: number;
  currency?: string;
  sourceUrl?: string;
};

/** Hardcoded catalog slices keyed by canonical category labels. */
const MOCK_BY_CATEGORY: Record<string, MockProductSeed[]> = {
  Kitesurf: [
    {
      title: 'Aile kite Freeride 9m',
      brand: 'North',
      category: 'Kitesurf',
      subCategory: 'Ailes',
      year: '2025',
      price: 1099.9,
      sourceUrl: 'https://example.com/p/kite-north-9',
    },
    {
      title: 'Barre 4 lignes Sensor 3',
      brand: 'Duotone',
      category: 'Kitesurf',
      subCategory: 'Barres',
      year: '2024',
      price: 449.0,
      sourceUrl: 'https://example.com/p/barre-duotone',
    },
    {
      title: 'Planche twin-tip Jaime',
      brand: 'Duotone',
      category: 'Kitesurf',
      subCategory: 'Planches',
      year: '2025',
      price: 599.0,
    },
    {
      title: 'Harnais ceinture Riot',
      brand: 'Ride Engine',
      category: 'Kitesurf',
      subCategory: 'Harnais',
      year: '2024',
      price: 219.99,
    },
  ],
  'Wing foil': [
    {
      title: 'Wing Strike 4.2',
      brand: 'F-One',
      category: 'Wing foil',
      subCategory: 'Ailes wing',
      year: '2025',
      price: 879.0,
      sourceUrl: 'https://example.com/p/wing-strike',
    },
    {
      title: 'Board Rocket Wing ASC 5\'4',
      brand: 'F-One',
      category: 'Wing foil',
      subCategory: 'Planches',
      year: '2025',
      price: 1249.0,
    },
    {
      title: 'Fuselage Alu 64cm',
      brand: 'Slingshot',
      category: 'Wing foil',
      subCategory: 'Foils',
      year: '2024',
      price: 129.0,
    },
  ],
  Vélo: [
    {
      title: 'Vélo route endurance Carbone',
      brand: 'Specialized',
      category: 'Vélo',
      subCategory: 'Route',
      year: '2025',
      price: 3499.0,
      sourceUrl: 'https://example.com/p/velo-route',
    },
    {
      title: 'VTT tout-suspendu 29"',
      brand: 'Trek',
      category: 'Vélo',
      subCategory: 'VTT',
      year: '2024',
      price: 2899.0,
    },
    {
      title: 'Casque MIPS Urbain',
      brand: 'Giro',
      category: 'Vélo',
      subCategory: 'Protection',
      year: '2025',
      price: 89.99,
    },
    {
      title: 'Lumière avant USB 800lm',
      brand: 'Lezyne',
      category: 'Vélo',
      subCategory: 'Accessoires',
      year: '2024',
      price: 54.9,
    },
  ],
  default: [
    {
      title: 'Pack bienvenue e-commerce',
      brand: 'Generic',
      category: 'Général',
      subCategory: 'Bundles',
      year: '2025',
      price: 49.9,
    },
    {
      title: 'Carte cadeau 50 €',
      brand: 'Boutique',
      category: 'Général',
      subCategory: 'Services',
      year: '2025',
      price: 50.0,
    },
    {
      title: 'T-shirt logo shop',
      brand: 'Boutique',
      category: 'Général',
      subCategory: 'Textile',
      year: '2024',
      price: 24.9,
    },
  ],
};

function canonicalCatalogKey(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t.includes('wing') && t.includes('foil')) return 'Wing foil';
  if (t.includes('kitesurf') || t.includes('kiteboard') || /\bkite\b/.test(t))
    return 'Kitesurf';
  if (
    t.includes('vélo') ||
    t.includes('velo') ||
    t.includes('vtt') ||
    t.includes('bike') ||
    t.includes('cyclisme')
  ) {
    return 'Vélo';
  }
  for (const k of Object.keys(MOCK_BY_CATEGORY)) {
    if (k !== 'default' && k.toLowerCase() === t) return k;
  }
  return null;
}

function resolveCatalogKeys(analysis: SiteAnalysis): string[] {
  const keys = new Set<string>();
  const fromAnalysis = analysis.catalogMatchCategories;
  if (Array.isArray(fromAnalysis)) {
    for (const c of fromAnalysis) {
      if (typeof c !== 'string') continue;
      const k = canonicalCatalogKey(c);
      if (k && MOCK_BY_CATEGORY[k]) keys.add(k);
    }
  }
  if (keys.size === 0) keys.add('default');
  return [...keys];
}

function deterministicUuid(analysisId: string, index: number): string {
  const h = createHash('sha256').update(`${analysisId}:mock:${index}`).digest();
  const bytes = Buffer.from(h.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function uniqueSorted(values: Iterable<string>): string[] {
  const s = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (t) s.add(t);
  }
  return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
}

const nowIso = (): string => new Date().toISOString();

export function buildProductListResponse(
  analysisId: string,
  analysis: SiteAnalysis,
): ProductListResponse {
  const keys = resolveCatalogKeys(analysis);
  const seeds: MockProductSeed[] = [];
  for (const k of keys) {
    const chunk = MOCK_BY_CATEGORY[k];
    if (chunk) seeds.push(...chunk);
  }

  const products: Product[] = seeds.map((s, idx) => ({
    id: deterministicUuid(analysisId, idx),
    siteAnalysisId: analysisId,
    title: s.title,
    brand: s.brand,
    year: s.year,
    category: s.category,
    subCategory: s.subCategory,
    price: s.price,
    currency: s.currency ?? 'EUR',
    sourceUrl: s.sourceUrl,
    createdAt: nowIso(),
  }));

  const brands = uniqueSorted(
    products.map((p) => p.brand).filter(Boolean) as string[],
  );
  const categories = uniqueSorted(
    products.map((p) => p.category).filter(Boolean) as string[],
  );
  const subCategories = uniqueSorted(
    products.map((p) => p.subCategory).filter(Boolean) as string[],
  );
  const years = uniqueSorted(
    products.map((p) => p.year).filter(Boolean) as string[],
  );

  return {
    products,
    total: products.length,
    brands,
    categories,
    subCategories,
    years,
  };
}
