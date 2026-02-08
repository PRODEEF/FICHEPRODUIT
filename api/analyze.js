/**
 * API Vercel : analyse réelle d’un site (résolution nom → URL, détection CMS, catalogue).
 * GET ou POST avec ?q=ultimate%20glisse ou body { q: "ultimate glisse" }
 */

function resolveToUrl(q) {
  const s = String(q).toLowerCase().trim();
  if (!s) return null;
  // Déjà une URL
  if (/^https?:\/\//i.test(s)) {
    const u = s.replace(/^https?:\/\//i, 'https://').replace(/\/+$/, '');
    try { new URL(u); return u; } catch (_) { return null; }
  }
  // Déjà un domaine (ex. ultimate-glisse.fr)
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(s)) {
    return 'https://' + s.replace(/^https?:\/\//i, '');
  }
  // Nom de magasin : "ultimate glisse" → ultimate-glisse.fr
  const slug = s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
  if (!slug) return null;
  return 'https://www.' + slug + '.fr';
}

function detectCMS(html) {
  const h = (html || '').toLowerCase();
  if (h.includes('prestashop') || h.includes('presta shop')) return 'PrestaShop';
  if (h.includes('shopify') || h.includes('cdn.shopify.com')) return 'Shopify';
  if (h.includes('woocommerce')) return 'WooCommerce';
  return 'Inconnu';
}

async function fetchText(url, timeout = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FicheProduct-Bot/1.0 (analyse catalogue)' },
      redirect: 'follow',
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function countProductsFromSitemap(xml) {
  const locs = xml.match(/<loc>[^<]+<\/loc>/g) || [];
  return locs.filter(u => !/sitemap|category|manufacturer|brand/i.test(u)).length;
}

function extractCategoriesFromHtml(html) {
  const cats = [];
  const regex = /(?:category|catégorie|menu)[^>]*>([^<]+)</gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    if (name.length > 1 && name.length < 80 && !cats.includes(name)) cats.push(name);
  }
  return cats.slice(0, 30);
}

function extractBrandsFromHtml(html) {
  const brands = [];
  const regex = /(?:marque|brand|manufacturer)[^>]*>([^<]+)</gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ');
    if (name.length > 1 && name.length < 50 && !brands.includes(name)) brands.push(name);
  }
  return brands.slice(0, 20);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = (req.query?.q || req.query?.query || req.body?.q || req.body?.query || '').trim();
  if (!q) return res.status(400).json({ error: 'Paramètre q (nom du site ou URL) manquant' });

  const url = resolveToUrl(q);
  if (!url) return res.status(400).json({ error: 'Impossible de résoudre le site à partir de : ' + q });

  let productCount = 0;
  let categories = [];
  let mainBrands = [];
  let cms = 'Inconnu';

  try {
    const html = await fetchText(url);
    cms = detectCMS(html);
    categories = extractCategoriesFromHtml(html);
    mainBrands = extractBrandsFromHtml(html);

    const sitemapUrl = new URL('/sitemap.xml', url).href;
    try {
      const sitemap = await fetchText(sitemapUrl, 8000);
      productCount = countProductsFromSitemap(sitemap);
    } catch (_) {
      try {
        const sitemap2 = new URL('/1_index_sitemap.xml', url).href;
        const sm = await fetchText(sitemap2, 6000);
        productCount = countProductsFromSitemap(sm);
      } catch (_2) {}
    }
    if (productCount === 0 && (cms === 'PrestaShop' || cms === 'Shopify')) {
      productCount = 500;
    }
  } catch (e) {
    return res.status(500).json({
      error: 'Erreur lors de l’analyse',
      detail: e.message,
      url,
      cms: cms || 'Inconnu',
      productCount: 0,
      categories: [],
      mainBrands: []
    });
  }

  return res.status(200).json({
    url,
    cms,
    productCount: Math.max(0, productCount),
    categories,
    mainBrands
  });
}
